import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    // Guest customer fields
    guestCustomer: {
        name: {
            type: String,
            required: function() { return !this.userId; }
        },
        email: {
            type: String,
            required: function() { return !this.userId; }
        },
        phone: {
            type: String,
            required: function() { return !this.userId; }
        }
    },
    isGuestOrder: {
        type: Boolean,
        default: false
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
    // Enhanced status tracking
    status: {
        type: String,
        enum: ['Received', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'],
        default: 'Received',
        required: true
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['Received', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    }],
    trackingNumber: {
        type: String,
        default: ''
    },
    estimatedDelivery: {
        type: Date,
        default: null
    },
    delivery_address: {
        type: mongoose.Schema.ObjectId,
        ref: 'address'
    },
    totalAmt: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    shippingRate: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Store shipping address directly in order (for admin visibility)
    shippingAddress: {
        addressLine1: String,
        addressLine2: String,
        city: String,
        province: String,
        provinceCode: String,
        postalCode: String,
        postal_code: String,
        country: String,
        countryCode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    // Store phone number directly in order (for admin visibility)
    phone: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
})

const OrderModel = mongoose.model('order', orderSchema)

export default OrderModel