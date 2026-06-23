import { Router } from "express";
import { createWorkflow, getAllWorkflows, getWorkflowById, saveWorkflow, updateCollaborators } from "../../controllers/workflow.controller.js";

const workflowRouter = Router({mergeParams: true})

workflowRouter.get('/', getAllWorkflows)
workflowRouter.get('/:id', getWorkflowById)
workflowRouter.post('/create', createWorkflow)
workflowRouter.post('/save/:id', saveWorkflow)
workflowRouter.post('/collaborators/:id', updateCollaborators)

export default workflowRouter