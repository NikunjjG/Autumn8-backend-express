import mongoose from "mongoose";

const workflow_schema = new mongoose.Schema({
    workflow_id:{
        type: mongoose.Schema.Types.UUID
    },
    name: {
        type: String,
        required: true,
    }, 
    description: {
        type: String,
    },
    version: {
        type: Number,
        required: true
    },
    published: {
        type: Boolean,
    },
    collaborative: {
        type: Boolean,
    },
    collaborators: {
        type: [{
            user_id: {
                type: Number,
                required: true
            },
            user_name:{
                type: String
            }
        }]
    },
    nodes: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    edges: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    createdBy: {
        type: Number,
        required: true,
    },
    modifiedBy: {
        type: Number,
    },
}, {
    timestamps: true
})

const WorkflowModel = mongoose.model("Workflow", workflow_schema)
export default WorkflowModel