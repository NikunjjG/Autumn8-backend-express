import { type Request, type Response } from "express"
import WorkflowModel from "../models/workflow.model.js"
import { randomUUID } from "node:crypto"

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
        const id = req.params.id ?? ''
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