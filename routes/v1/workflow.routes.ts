import { Router } from "express";
import { createCollaborativeSession, createWorkflow, endCollaborativeSession, getAllWorkflows, getWorkflowById, saveWorkflow, updateCollaborators } from "../../controllers/workflow.controller.js";

const workflowRouter = Router({mergeParams: true})

workflowRouter.get('/', getAllWorkflows)
workflowRouter.get('/:id', getWorkflowById)
workflowRouter.post('/create', createWorkflow)
workflowRouter.post('/save/:id', saveWorkflow)
workflowRouter.post('/collaborators/:id', updateCollaborators)
workflowRouter.post('/collaborate/:id', createCollaborativeSession)
workflowRouter.delete('/collaborate/:id', endCollaborativeSession)

export default workflowRouter