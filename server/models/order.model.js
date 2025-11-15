import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    products: [
        {
            productId: {
                type: String,
                required: true
            },
            productTitle: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            image: {
                type: String
            },
            subTotal: {
                type: Number,
                required: true
            },
            // New variation fields
            productType: {
                type: String,
                enum: ['simple', 'variable'],
                default: 'simple'
            },
            variationId: {
                type: String,
                default: null
            },
            variation: {
                attributes: [{
                    name: String,
                    value: String
                }],
                sku: String,
                image: String
            },
            // Old fields (backward compatibility)
            size: {
                type: String,
                default: null
            },
            weight: {
                type: String,
                default: null
            },
            ram: {
                type: String,
                default: null
            },
            countInStock: {
                type: Number
            }
        }
    ],
    paymentId: {
        type: String,
        default: ""
    },
    payment_status : {
        type : String,
        default : ""
    },
    order_status : {
        type : String,
        default : "confirm"
    },
    delivery_address: {
        type: mongoose.Schema.ObjectId,
        ref: 'address'
    },
    totalAmt: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

const OrderModel = mongoose.model('order', orderSchema)

export default OrderModel