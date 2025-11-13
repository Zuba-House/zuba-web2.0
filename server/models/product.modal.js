import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    images: [
        {
            type: String,
            required: true
        }
    ],
    brand: {
        type: String,
        default: ''
    },

    // Product type: "simple" (existing behavior) or "variable" (with variations)
    productType: {
        type: String,
        enum: ['simple', 'variable'],
        default: 'simple'
    },

    price: {
        type: Number,
        default: 0
    },

    currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'INR', 'EUR']
   },

    // For variable products: price range display
    priceRange: {
        min: {
            type: Number,
            default: 0
        },
        max: {
            type: Number,
            default: 0
        }
    },

    // Attributes used in this product (only for variable products)
    // Example: [ { attributeId: ObjectId, values: [ObjectId, ObjectId] } ]
    attributes: [
        {
            attributeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Attribute'
            },
            values: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'AttributeValue'
                }
            ]
        }
    ],



    oldPrice: {
        type: Number,
        default: 0
    },
    catName:{
        type:String,
        default:''
    },
    catId:{
        type:String,
        default:''
    },
    subCatId:{
        type:String,
        default:''
    },
    subCat:{
        type:String,
        default:''
    },
    thirdsubCat:{
        type:String,
        default:''
    },
    thirdsubCatId:{
        type:String,
        default:''
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    countInStock: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    discount: {
        type: Number,
        required: false,
    },
    sale: {
        type: Number,
        default:0
    },
    productRam: [
        {
            type: String,
            default: null,
        }
    ],
    size: [
        {
            type: String,
            default: null,
        }
    ],
    productWeight: [
        {
            type: String,
            default: null,
        }
    ],
    bannerimages: [
        {
            type: String,
            required: true
        }
    ],
    bannerTitleName: {
        type: String,
        default: '',
    },
    isDisplayOnHomeBanner: {
        type: Boolean,
        default: false,
    },
},{
    timestamps : true
});


const ProductModel = mongoose.model('Product',productSchema)

export default ProductModel