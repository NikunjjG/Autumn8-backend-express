import { type Request, type Response } from "express"
import WorkflowModel from "../models/workflow.model.js"
import { randomUUID } from "node:crypto"
import { generateJWTToken } from "../utils/helper.functions.js"
import redis from "../redis.js"
import { io } from "../server.js"
import { WEB_SOCKET_ACTIONS } from "../constants/ws_actions.js"

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000'

export const getAllWorkflows = async (req: Request, res: Response) => {
    try{
        const userid = req.user!.id
        const workflows = await WorkflowModel.find({createdBy: userid}).select('workflow_id name published collaborative collaborators updatedAt')
        if(workflows){
            return res.status(200).json({content: workflows})
        }else{
            return res.status(200).send({content: []})
        }
    }catch(err){
        console.log(err)
        return res.status(409).json({msg: "There was some error fetching workflows", err: err})
    }
}

export const getWorkflowById = async (req: Request, res: Response) => {
    try{
        const params_workflow_id = req.params.id ?? ''
        const workflow = await WorkflowModel.findOne({workflow_id: params_workflow_id})
        if(workflow){
            return res.status(200).json({content: workflow})
        }else{
            return res.status(404).json({msg: "No workflow with the given id found"})
        }
    }catch(err){
        console.log(err)
        return res.status(409).json({msg: "There was some error fetching workflow", err: err})
    }
}

export const createWorkflow = async (req: Request, res: Response) => {
    try{
        const workflow_id = randomUUID()
        await WorkflowModel.create({
            workflow_id: workflow_id,
            name: req.body.name,
            version: 0,
            nodes: [{
                id: 'start_1',
                type: 'start',
                position: { x: 100, y: 300 },
                data: {},
                deletable: false,
            }],
            edges: [],
            createdBy: req.user!.id
        })
        return res.status(201).json({msg: "Workflow created succesfully", id: workflow_id})
    }catch(err){
        console.log(err)
        return res.status(409).json({msg: "There was an error saving worflow", err: err})
    }
}

export const saveWorkflow = async (req: Request, res: Response) => {
    try{
        const id = req.params.id
        const { collaborators, ...updates } = req.body
        await WorkflowModel.findOneAndUpdate(
            {workflow_id: id ?? ''},
            {...updates, modifiedBy: req.user!.id},
            {new: true}
        )
        return res.status(200).json({msg: "Updated succesfully!"})
    }catch(err){
        console.log(err)
        return res.status(409).json({msg: "There was an error saving worflow", err: err})
    }
}

export const updateCollaborators = async (req: Request, res: Response) => {
    try{
        await WorkflowModel.findOneAndUpdate(
        { workflow_id: req.params.id ?? '' },
            { 
                collaborative: true,
                $addToSet: { collaborators: { user_id: req.user!.id, user_name: req.user!.username } }
            }
        )
        res.status(200).json({msg:"Collaborator added succesfully."})
    }catch(err){
        console.log(err)
        return res.status(409).json({msg: "Could not add collaborator", err: err, action: "_REDIRECT"})
    }
}

export const createCollaborativeSession = async (req: Request, res: Response) => {
    try{
        const workflowId = req.params.id
        if(!workflowId){
            return res.status(409).json({msg: "Could not create a collaborative session, missing workflow details"})
        }
        const token = await generateJWTToken({workflowId}, process.env.JWT_SECRET_COLLABORATION ?? '' , '1h')
        await redis.set(`collab:${workflowId}:${token}`, workflowId?.toString(), 'EX', 3600)
        return res.status(200).json({content: token})
    }catch(err){
        console.log(err)
        return res.status(409).json({msg: "Could not create a collaborative session", err: err})
    }
}

export const endCollaborativeSession = async (req: Request, res: Response) => {
    try{
        const workflowId = req.params.id
        io.to(`workflow:${workflowId}`).emit(WEB_SOCKET_ACTIONS.SESSION_EXPIRED)
        const stream = redis.scanStream({ match: `collab:${workflowId?.toString() ?? ''}:*` })
        stream.on("data", async (keys: string[]) => {
            if (keys.length) await redis.del(...keys)
        })
        stream.on("end", () => {
            return res.status(200).json({ msg: "Session ended" })
        })
        stream.on("error", (err: Error) => {
            return res.status(500).json({ msg: "Failed to end session", err: err })
        })
    }catch(err){
        console.log(err)
        return res.status(409).json({ msg: "There was some error closing the session", err: err })
    }
}

const NODE_COSTS: Record<string, number> = {
    llm_agent: 5,
    http_request: 5,
}

export const executeWorkflow = async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.id
        const userId = req.user!.id.toString()
        const { nodes, edges, triggerPayload } = req.body

        if (!nodes || !edges) {
            return res.status(400).json({ msg: "Missing nodes or edges in request body" })
        }

        const { getUserCredits } = await import("../services/credits.service.js")
        const userCredits = await getUserCredits(userId) ?? 0

        const estimatedCost = (nodes as any[]).reduce((cost: number, node: any) => {
            return cost + (NODE_COSTS[node.type] ?? 0)
        }, 0)

        if (userCredits < estimatedCost) {
            return res.status(403).json({
                msg: "Insufficient credits",
                required: estimatedCost,
                available: userCredits,
            })
        }

        const expressUrl = process.env.EXPRESS_URL ?? 'http://localhost:8800'
        const callbackUrl = `${expressUrl}/workflows/${workflowId}/progress`

        res.status(200).json({ msg: "Execution started" })

        fetch(`${FASTAPI_URL}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workflowId,
                userId: req.user!.id,
                nodes,
                edges,
                triggerPayload: triggerPayload ?? {},
                callbackUrl,
            }),
        })
        .then((response) => response.json())
        .then(async (result) => {
            if (result.success && result.totalCost > 0) {
                const { deductUserCredits } = await import("../services/credits.service.js")
                const deductResult = await deductUserCredits(userId, result.totalCost)
                io.to(`workflow:${workflowId}`).emit('EXECUTION_PROGRESS', {
                    event: 'credits_deducted',
                    cost: result.totalCost,
                    remaining: deductResult?.remaining ?? 0,
                })
            }
        })
        .catch((err) => {
            console.log('Execution error:', err)
            io.to(`workflow:${workflowId}`).emit('EXECUTION_PROGRESS', {
                event: 'workflow_error',
                error: 'Execution engine unreachable',
            })
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ msg: "Workflow execution failed", err: err })
    }
}