/**
 * Check for systemic issues that could cause ALL orders to fail
 * Run this to identify widespread problems
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import connectDB from '../config/connectDb.js';

dotenv.config();

const checkSystemicIssues = async () => {
    try {
        console.log('🔍 Checking for systemic order failure issues...\n');
        
        await connectDB();
        console.log('✅ Connected to database\n');

        // 1. Check recent order success/failure ratio
        console.log('📊 Order Success/Failure Analysis:');
        console.log('='.repeat(80));
        
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentOrders = await OrderModel.find({
            createdAt: { $gte: last24Hours }
        }).select('payment_status createdAt');

        const totalRecent = recentOrders.length;
        const failedRecent = recentOrders.filter(o => o.payment_status === 'FAILED').length;
        const completedRecent = recentOrders.filter(o => 
            o.payment_status === 'COMPLETED' || o.payment_status === 'SUCCEEDED'
        ).length;
        const otherStatus = totalRecent - failedRecent - completedRecent;

        console.log(`\nLast 24 Hours:`);
        console.log(`  Total Orders: ${totalRecent}`);
        console.log(`  Failed: ${failedRecent} (${totalRecent > 0 ? ((failedRecent / totalRecent) * 100).toFixed(2) : 0}%)`);
        console.log(`  Completed: ${completedRecent} (${totalRecent > 0 ? ((completedRecent / totalRecent) * 100).toFixed(2) : 0}%)`);
        console.log(`  Other Status: ${otherStatus}`);

        if (failedRecent > 0 && completedRecent === 0) {
            console.log('\n⚠️ CRITICAL: 100% failure rate detected! All orders are failing.');
        } else if (failedRecent > completedRecent * 2) {
            console.log('\n⚠️ WARNING: Very high failure rate detected!');
        }

        // 2. Check for orders with payment but no order (transaction rollback issue)
        console.log('\n\n🔍 Checking for Payment-But-No-Order Issue:');
        console.log('='.repeat(80));
        
        const failedWithPaymentId = await OrderModel.find({
            payment_status: 'FAILED',
            paymentId: { $exists: true, $ne: '' }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id createdAt paymentId failReason failCode');

        console.log(`\nFailed orders with payment IDs: ${failedWithPaymentId.length}`);
        if (failedWithPaymentId.length > 0) {
            console.log('\nSample failed orders:');
            failedWithPaymentId.forEach((order, i) => {
                console.log(`\n  ${i + 1}. Order: ${order._id}`);
                console.log(`     Payment ID: ${order.paymentId}`);
                console.log(`     Created: ${order.createdAt}`);
                console.log(`     Reason: ${order.failReason || 'N/A'}`);
                console.log(`     Code: ${order.failCode || 'N/A'}`);
            });
        }

        // 3. Check for common failure patterns
        console.log('\n\n📋 Failure Pattern Analysis:');
        console.log('='.repeat(80));
        
        const allFailed = await OrderModel.find({
            payment_status: 'FAILED',
            createdAt: { $gte: last24Hours }
        }).select('failReason failCode failType failDeclineCode');

        const reasonCounts = {};
        const codeCounts = {};
        const declineCodeCounts = {};

        allFailed.forEach(order => {
            const reason = order.failReason || 'Unknown';
            const code = order.failCode || 'No code';
            const decline = order.failDeclineCode || 'No decline code';
            
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            codeCounts[code] = (codeCounts[code] || 0) + 1;
            declineCodeCounts[decline] = (declineCodeCounts[decline] || 0) + 1;
        });

        console.log('\nTop Failure Reasons:');
        Object.entries(reasonCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([reason, count]) => {
                const percentage = ((count / allFailed.length) * 100).toFixed(1);
                console.log(`  "${reason}": ${count} times (${percentage}%)`);
            });

        console.log('\nTop Failure Codes:');
        Object.entries(codeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([code, count]) => {
                const percentage = ((count / allFailed.length) * 100).toFixed(1);
                console.log(`  "${code}": ${count} times (${percentage}%)`);
            });

        console.log('\nTop Decline Codes:');
        Object.entries(declineCodeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([decline, count]) => {
                const percentage = ((count / allFailed.length) * 100).toFixed(1);
                console.log(`  "${decline}": ${count} times (${percentage}%)`);
            });

        // 4. Check for stock-related failures
        console.log('\n\n📦 Checking Stock-Related Issues:');
        console.log('='.repeat(80));
        
        const stockRelatedFailures = allFailed.filter(o => 
            (o.failReason && (
                o.failReason.toLowerCase().includes('stock') ||
                o.failReason.toLowerCase().includes('insufficient') ||
                o.failReason.toLowerCase().includes('out of stock')
            ))
        );

        console.log(`\nStock-related failures: ${stockRelatedFailures.length} (${allFailed.length > 0 ? ((stockRelatedFailures.length / allFailed.length) * 100).toFixed(1) : 0}%)`);

        // 5. Check for transaction/validation failures
        console.log('\n\n⚙️ Checking Transaction/Validation Issues:');
        console.log('='.repeat(80));
        
        const validationFailures = allFailed.filter(o => 
            (o.failReason && (
                o.failReason.toLowerCase().includes('validation') ||
                o.failReason.toLowerCase().includes('required') ||
                o.failReason.toLowerCase().includes('missing') ||
                o.failReason.toLowerCase().includes('not found')
            ))
        );

        console.log(`\nValidation-related failures: ${validationFailures.length} (${allFailed.length > 0 ? ((validationFailures.length / allFailed.length) * 100).toFixed(1) : 0}%)`);

        // 6. Check Stripe decline codes
        console.log('\n\n💳 Stripe Decline Code Analysis:');
        console.log('='.repeat(80));
        
        const stripeDeclines = allFailed.filter(o => o.failDeclineCode && o.failDeclineCode !== 'No decline code');
        
        if (stripeDeclines.length > 0) {
            console.log(`\nOrders with Stripe decline codes: ${stripeDeclines.length}`);
            
            const declineGroups = {};
            stripeDeclines.forEach(o => {
                const code = o.failDeclineCode;
                declineGroups[code] = (declineGroups[code] || 0) + 1;
            });

            console.log('\nDecline code breakdown:');
            Object.entries(declineGroups)
                .sort((a, b) => b[1] - a[1])
                .forEach(([code, count]) => {
                    const percentage = ((count / stripeDeclines.length) * 100).toFixed(1);
                    console.log(`  ${code}: ${count} times (${percentage}%)`);
                });
        } else {
            console.log('\n⚠️ No Stripe decline codes found - failures may be happening before payment');
        }

        // 7. Recommendations
        console.log('\n\n💡 Recommendations:');
        console.log('='.repeat(80));

        if (failedRecent > 0 && completedRecent === 0) {
            console.log('\n❌ CRITICAL ISSUE: 100% failure rate!');
            console.log('   Possible causes:');
            console.log('   1. Transaction rollback after payment succeeds');
            console.log('   2. Stock validation failing for all products');
            console.log('   3. Database connection issues during transactions');
            console.log('   4. Product validation failing systematically');
            console.log('\n   ACTION REQUIRED:');
            console.log('   - Check server logs for transaction errors');
            console.log('   - Verify all products have stock and are published');
            console.log('   - Check MongoDB connection and transaction support');
            console.log('   - Review recent code changes');
        }

        if (stockRelatedFailures.length > allFailed.length * 0.5) {
            console.log('\n⚠️ High stock-related failures detected');
            console.log('   - Check product inventory levels');
            console.log('   - Verify stock validation logic');
            console.log('   - Consider race condition issues');
        }

        if (validationFailures.length > allFailed.length * 0.3) {
            console.log('\n⚠️ High validation failures detected');
            console.log('   - Check required fields in order payload');
            console.log('   - Verify product data structure');
            console.log('   - Check guest customer data format');
        }

        const insufficientFunds = allFailed.filter(o => 
            o.failDeclineCode === 'insufficient_funds' || 
            (o.failReason && o.failReason.toLowerCase().includes('insufficient'))
        ).length;

        if (insufficientFunds > allFailed.length * 0.5) {
            console.log('\n⚠️ High insufficient funds failures');
            console.log('   - This is normal customer payment issue');
            console.log('   - Not a system bug, but consider payment alternatives');
        }

        console.log('\n\n✅ Analysis complete!\n');

    } catch (error) {
        console.error('❌ Error during analysis:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
};

checkSystemicIssues();
