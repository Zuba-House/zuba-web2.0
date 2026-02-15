/**
 * Diagnostic script to identify why orders are failing
 * Run this to check common failure points
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import connectDB from '../config/connectDb.js';

dotenv.config();

const diagnoseOrderFailures = async () => {
    try {
        console.log('🔍 Starting order failure diagnosis...\n');
        
        // Connect to database
        await connectDB();
        console.log('✅ Connected to database\n');

        // 1. Check recent failed orders
        console.log('📊 Analyzing recent failed orders...');
        const recentFailedOrders = await OrderModel.find({
            payment_status: 'FAILED'
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('_id createdAt paymentId failReason failCode failType failDeclineCode products userId guestCustomer');

        console.log(`Found ${recentFailedOrders.length} recent failed orders\n`);

        if (recentFailedOrders.length > 0) {
            console.log('📋 Recent Failed Orders Analysis:');
            console.log('='.repeat(80));
            
            const failureReasons = {};
            const failureCodes = {};
            const failureTypes = {};
            
            recentFailedOrders.forEach((order, index) => {
                const reason = order.failReason || 'Unknown';
                const code = order.failCode || 'No code';
                const type = order.failType || 'No type';
                
                failureReasons[reason] = (failureReasons[reason] || 0) + 1;
                failureCodes[code] = (failureCodes[code] || 0) + 1;
                failureTypes[type] = (failureTypes[type] || 0) + 1;
                
                console.log(`\nOrder #${index + 1}:`);
                console.log(`  Order ID: ${order._id}`);
                console.log(`  Created: ${order.createdAt}`);
                console.log(`  Payment ID: ${order.paymentId || 'N/A'}`);
                console.log(`  Reason: ${reason}`);
                console.log(`  Code: ${code}`);
                console.log(`  Type: ${type}`);
                console.log(`  Decline Code: ${order.failDeclineCode || 'N/A'}`);
                console.log(`  Products Count: ${order.products?.length || 0}`);
                console.log(`  User: ${order.userId ? 'Logged in' : order.guestCustomer ? 'Guest' : 'Unknown'}`);
            });

            console.log('\n\n📈 Failure Statistics:');
            console.log('='.repeat(80));
            console.log('\nTop Failure Reasons:');
            Object.entries(failureReasons)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([reason, count]) => {
                    console.log(`  ${reason}: ${count} times`);
                });

            console.log('\nTop Failure Codes:');
            Object.entries(failureCodes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([code, count]) => {
                    console.log(`  ${code}: ${count} times`);
                });

            console.log('\nTop Failure Types:');
            Object.entries(failureTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([type, count]) => {
                    console.log(`  ${type}: ${count} times`);
                });
        }

        // 2. Check for products with issues
        console.log('\n\n🔍 Checking products for common issues...');
        console.log('='.repeat(80));
        
        const allProducts = await ProductModel.find({}).select('_id name status countInStock inventory variations');
        
        const productsWithIssues = {
            outOfStock: [],
            notPublished: [],
            noStock: [],
            variableProductsNoStock: []
        };

        allProducts.forEach(product => {
            if (product.status !== 'published') {
                productsWithIssues.notPublished.push({
                    id: product._id,
                    name: product.name
                });
            }

            if (product.productType === 'variable' || product.type === 'variable') {
                const hasStock = product.variations?.some(v => (v.stock || 0) > 0);
                if (!hasStock) {
                    productsWithIssues.variableProductsNoStock.push({
                        id: product._id,
                        name: product.name
                    });
                }
            } else {
                const stock = product.countInStock || product.inventory?.stock || 0;
                if (stock === 0) {
                    productsWithIssues.noStock.push({
                        id: product._id,
                        name: product.name
                    });
                }
            }
        });

        console.log(`\nProducts not published: ${productsWithIssues.notPublished.length}`);
        if (productsWithIssues.notPublished.length > 0 && productsWithIssues.notPublished.length <= 10) {
            productsWithIssues.notPublished.forEach(p => {
                console.log(`  - ${p.name} (${p.id})`);
            });
        }

        console.log(`\nSimple products with no stock: ${productsWithIssues.noStock.length}`);
        if (productsWithIssues.noStock.length > 0 && productsWithIssues.noStock.length <= 10) {
            productsWithIssues.noStock.forEach(p => {
                console.log(`  - ${p.name} (${p.id})`);
            });
        }

        console.log(`\nVariable products with no stock: ${productsWithIssues.variableProductsNoStock.length}`);
        if (productsWithIssues.variableProductsNoStock.length > 0 && productsWithIssues.variableProductsNoStock.length <= 10) {
            productsWithIssues.variableProductsNoStock.forEach(p => {
                console.log(`  - ${p.name} (${p.id})`);
            });
        }

        // 3. Check Stripe configuration
        console.log('\n\n💳 Checking Stripe Configuration...');
        console.log('='.repeat(80));
        
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
            console.log('❌ STRIPE_SECRET_KEY is not set');
        } else {
            const keyPrefix = stripeKey.substring(0, 7);
            const isTestMode = !stripeKey.startsWith('sk_live_');
            console.log(`✅ Stripe key is set (${keyPrefix}...)`);
            console.log(`   Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
        }

        // 4. Check order creation patterns
        console.log('\n\n📦 Order Creation Patterns...');
        console.log('='.repeat(80));
        
        const totalOrders = await OrderModel.countDocuments({});
        const failedOrders = await OrderModel.countDocuments({ payment_status: 'FAILED' });
        const completedOrders = await OrderModel.countDocuments({ payment_status: { $in: ['COMPLETED', 'SUCCEEDED'] } });
        const pendingOrders = await OrderModel.countDocuments({ payment_status: { $nin: ['FAILED', 'COMPLETED', 'SUCCEEDED'] } });

        console.log(`Total Orders: ${totalOrders}`);
        console.log(`Failed Orders: ${failedOrders} (${totalOrders > 0 ? ((failedOrders / totalOrders) * 100).toFixed(2) : 0}%)`);
        console.log(`Completed Orders: ${completedOrders} (${totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0}%)`);
        console.log(`Pending/Other Orders: ${pendingOrders}`);

        // 5. Check for orders with missing data
        console.log('\n\n⚠️ Checking for orders with missing critical data...');
        console.log('='.repeat(80));
        
        const ordersWithoutProducts = await OrderModel.countDocuments({
            $or: [
                { products: { $exists: false } },
                { products: { $size: 0 } }
            ]
        });

        const ordersWithoutPaymentId = await OrderModel.countDocuments({
            payment_status: 'FAILED',
            paymentId: { $in: [null, '', undefined] }
        });

        console.log(`Orders without products: ${ordersWithoutProducts}`);
        console.log(`Failed orders without payment ID: ${ordersWithoutPaymentId}`);

        // 6. Recommendations
        console.log('\n\n💡 Recommendations:');
        console.log('='.repeat(80));
        
        if (failedOrders > 0) {
            const failureRate = (failedOrders / totalOrders) * 100;
            if (failureRate > 50) {
                console.log('⚠️ HIGH FAILURE RATE DETECTED!');
                console.log('   - Check Stripe API key configuration');
                console.log('   - Verify payment processing is working');
                console.log('   - Review server logs for detailed error messages');
            }
        }

        if (productsWithIssues.notPublished.length > 0) {
            console.log('\n⚠️ Some products are not published:');
            console.log('   - These products cannot be ordered');
            console.log('   - Publish products or remove them from carts');
        }

        if (productsWithIssues.noStock.length > 0 || productsWithIssues.variableProductsNoStock.length > 0) {
            console.log('\n⚠️ Some products are out of stock:');
            console.log('   - Update stock levels or mark products as out of stock');
            console.log('   - Consider disabling out-of-stock products');
        }

        if (!stripeKey) {
            console.log('\n❌ CRITICAL: Stripe is not configured');
            console.log('   - Set STRIPE_SECRET_KEY in environment variables');
            console.log('   - All payments will fail without this');
        }

        console.log('\n\n✅ Diagnosis complete!\n');

    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
};

// Run diagnosis
diagnoseOrderFailures();
