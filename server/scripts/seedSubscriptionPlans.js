/**
 * Seed Subscription Plans
 * Run: node server/scripts/seedSubscriptionPlans.js
 * 
 * Creates the 5 default subscription tiers:
 * Free, Bronze, Silver, Gold, Platinum
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SubscriptionPlanModel from '../models/subscriptionPlan.model.js';

dotenv.config();

const subscriptionPlans = [
  {
    name: 'Free',
    displayName: 'Free Plan',
    slug: 'free',
    description: 'Perfect for getting started. List up to 50 products with basic features.',
    shortDescription: 'Start selling for free',
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: 'USD'
    },
    yearlyDiscount: 0,
    limits: {
      maxProducts: 50,
      maxImagesPerProduct: 3,
      maxCategories: 5,
      storageLimit: 500,
      maxOrders: -1,
      maxStaffAccounts: 0
    },
    commission: {
      rate: 15,
      type: 'percentage'
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicReports: true,
      advancedAnalytics: false,
      customDomain: false,
      removeBranding: false,
      apiAccess: false,
      bulkOperations: false,
      exportData: false,
      promotions: false,
      couponCodes: false,
      emailMarketing: false,
      seoTools: false,
      socialMediaIntegration: false,
      featuredProducts: false,
      emailSupport: true,
      chatSupport: false,
      prioritySupport: false,
      phoneSupport: false,
      dedicatedManager: false,
      shippingIntegration: false,
      paymentGatewayOptions: false,
      inventorySync: false,
      multiWarehouse: false,
      variableProducts: true,
      digitalProducts: false,
      subscriptionProducts: false,
      auctionProducts: false
    },
    badge: {
      icon: '🏷️',
      color: '#6c757d',
      backgroundColor: '#f8f9fa',
      text: 'Free'
    },
    displayOrder: 1,
    isPopular: false,
    isRecommended: false,
    isActive: true,
    isDefault: true,
    trialDays: 0,
    gracePeriodDays: 0,
    featureList: [
      { text: 'Up to 50 products', included: true, highlight: false },
      { text: '3 images per product', included: true, highlight: false },
      { text: '500MB storage', included: true, highlight: false },
      { text: '15% commission', included: true, highlight: false },
      { text: 'Basic dashboard', included: true, highlight: false },
      { text: 'Email support', included: true, highlight: false },
      { text: 'Advanced analytics', included: false, highlight: false },
      { text: 'Promotions & coupons', included: false, highlight: false }
    ]
  },
  {
    name: 'Bronze',
    displayName: 'Bronze Plan',
    slug: 'bronze',
    description: 'For growing businesses. More products, lower commission, and promotional tools.',
    shortDescription: 'Grow your business',
    pricing: {
      monthly: 19,
      yearly: 190,
      currency: 'USD'
    },
    yearlyDiscount: 17,
    limits: {
      maxProducts: 200,
      maxImagesPerProduct: 5,
      maxCategories: 15,
      storageLimit: 2048,
      maxOrders: -1,
      maxStaffAccounts: 1
    },
    commission: {
      rate: 12,
      type: 'percentage'
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicReports: true,
      advancedAnalytics: false,
      customDomain: false,
      removeBranding: false,
      apiAccess: false,
      bulkOperations: true,
      exportData: true,
      promotions: true,
      couponCodes: true,
      emailMarketing: false,
      seoTools: false,
      socialMediaIntegration: false,
      featuredProducts: false,
      emailSupport: true,
      chatSupport: false,
      prioritySupport: false,
      phoneSupport: false,
      dedicatedManager: false,
      shippingIntegration: false,
      paymentGatewayOptions: false,
      inventorySync: false,
      multiWarehouse: false,
      variableProducts: true,
      digitalProducts: true,
      subscriptionProducts: false,
      auctionProducts: false
    },
    badge: {
      icon: '🥉',
      color: '#cd7f32',
      backgroundColor: '#fef5e7',
      text: 'Bronze'
    },
    displayOrder: 2,
    isPopular: false,
    isRecommended: false,
    isActive: true,
    isDefault: false,
    trialDays: 7,
    gracePeriodDays: 7,
    featureList: [
      { text: 'Up to 200 products', included: true, highlight: true },
      { text: '5 images per product', included: true, highlight: false },
      { text: '2GB storage', included: true, highlight: false },
      { text: '12% commission', included: true, highlight: true },
      { text: 'Promotions & coupons', included: true, highlight: true },
      { text: 'Bulk operations', included: true, highlight: false },
      { text: 'Export data', included: true, highlight: false },
      { text: '7-day free trial', included: true, highlight: true }
    ]
  },
  {
    name: 'Silver',
    displayName: 'Silver Plan',
    slug: 'silver',
    description: 'For established sellers. Advanced analytics, SEO tools, and priority support.',
    shortDescription: 'Scale your sales',
    pricing: {
      monthly: 49,
      yearly: 470,
      currency: 'USD'
    },
    yearlyDiscount: 20,
    limits: {
      maxProducts: 500,
      maxImagesPerProduct: 10,
      maxCategories: 30,
      storageLimit: 10240,
      maxOrders: -1,
      maxStaffAccounts: 3
    },
    commission: {
      rate: 10,
      type: 'percentage'
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicReports: true,
      advancedAnalytics: true,
      customDomain: false,
      removeBranding: false,
      apiAccess: false,
      bulkOperations: true,
      exportData: true,
      promotions: true,
      couponCodes: true,
      emailMarketing: true,
      seoTools: true,
      socialMediaIntegration: true,
      featuredProducts: true,
      emailSupport: true,
      chatSupport: true,
      prioritySupport: true,
      phoneSupport: false,
      dedicatedManager: false,
      shippingIntegration: true,
      paymentGatewayOptions: false,
      inventorySync: true,
      multiWarehouse: false,
      variableProducts: true,
      digitalProducts: true,
      subscriptionProducts: false,
      auctionProducts: false
    },
    badge: {
      icon: '🥈',
      color: '#C0C0C0',
      backgroundColor: '#f5f5f5',
      text: 'Silver'
    },
    displayOrder: 3,
    isPopular: true,
    isRecommended: true,
    highlightText: 'Most Popular',
    isActive: true,
    isDefault: false,
    trialDays: 14,
    gracePeriodDays: 7,
    featureList: [
      { text: 'Up to 500 products', included: true, highlight: true },
      { text: '10 images per product', included: true, highlight: false },
      { text: '10GB storage', included: true, highlight: false },
      { text: '10% commission', included: true, highlight: true },
      { text: 'Advanced analytics', included: true, highlight: true },
      { text: 'SEO tools', included: true, highlight: true },
      { text: 'Priority support', included: true, highlight: false },
      { text: '14-day free trial', included: true, highlight: true }
    ]
  },
  {
    name: 'Gold',
    displayName: 'Gold Plan',
    slug: 'gold',
    description: 'For power sellers. Custom domain, API access, and advanced integrations.',
    shortDescription: 'Maximize your potential',
    pricing: {
      monthly: 99,
      yearly: 950,
      currency: 'USD'
    },
    yearlyDiscount: 20,
    limits: {
      maxProducts: 2000,
      maxImagesPerProduct: 15,
      maxCategories: 50,
      storageLimit: 51200,
      maxOrders: -1,
      maxStaffAccounts: 5
    },
    commission: {
      rate: 8,
      type: 'percentage'
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicReports: true,
      advancedAnalytics: true,
      customDomain: true,
      removeBranding: true,
      apiAccess: true,
      bulkOperations: true,
      exportData: true,
      promotions: true,
      couponCodes: true,
      emailMarketing: true,
      seoTools: true,
      socialMediaIntegration: true,
      featuredProducts: true,
      emailSupport: true,
      chatSupport: true,
      prioritySupport: true,
      phoneSupport: true,
      dedicatedManager: false,
      shippingIntegration: true,
      paymentGatewayOptions: true,
      inventorySync: true,
      multiWarehouse: true,
      variableProducts: true,
      digitalProducts: true,
      subscriptionProducts: true,
      auctionProducts: false
    },
    badge: {
      icon: '🥇',
      color: '#FFD700',
      backgroundColor: '#fff9e6',
      text: 'Gold'
    },
    displayOrder: 4,
    isPopular: false,
    isRecommended: false,
    isActive: true,
    isDefault: false,
    trialDays: 14,
    gracePeriodDays: 14,
    featureList: [
      { text: 'Up to 2,000 products', included: true, highlight: true },
      { text: '15 images per product', included: true, highlight: false },
      { text: '50GB storage', included: true, highlight: false },
      { text: '8% commission', included: true, highlight: true },
      { text: 'Custom domain', included: true, highlight: true },
      { text: 'API access', included: true, highlight: true },
      { text: 'Phone support', included: true, highlight: false },
      { text: 'Multi-warehouse', included: true, highlight: false }
    ]
  },
  {
    name: 'Platinum',
    displayName: 'Platinum Plan',
    slug: 'platinum',
    description: 'Enterprise-grade solution. Unlimited products, lowest commission, and dedicated account manager.',
    shortDescription: 'Enterprise solution',
    pricing: {
      monthly: 299,
      yearly: 2880,
      currency: 'USD'
    },
    yearlyDiscount: 20,
    limits: {
      maxProducts: -1,
      maxImagesPerProduct: 20,
      maxCategories: -1,
      storageLimit: 204800,
      maxOrders: -1,
      maxStaffAccounts: 20
    },
    commission: {
      rate: 5,
      type: 'percentage'
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicReports: true,
      advancedAnalytics: true,
      customDomain: true,
      removeBranding: true,
      apiAccess: true,
      bulkOperations: true,
      exportData: true,
      promotions: true,
      couponCodes: true,
      emailMarketing: true,
      seoTools: true,
      socialMediaIntegration: true,
      featuredProducts: true,
      emailSupport: true,
      chatSupport: true,
      prioritySupport: true,
      phoneSupport: true,
      dedicatedManager: true,
      shippingIntegration: true,
      paymentGatewayOptions: true,
      inventorySync: true,
      multiWarehouse: true,
      variableProducts: true,
      digitalProducts: true,
      subscriptionProducts: true,
      auctionProducts: true
    },
    badge: {
      icon: '💎',
      color: '#E5E4E2',
      backgroundColor: '#f8f8ff',
      text: 'Platinum'
    },
    displayOrder: 5,
    isPopular: false,
    isRecommended: false,
    isActive: true,
    isDefault: false,
    trialDays: 30,
    gracePeriodDays: 30,
    featureList: [
      { text: 'Unlimited products', included: true, highlight: true },
      { text: '20 images per product', included: true, highlight: false },
      { text: '200GB storage', included: true, highlight: false },
      { text: '5% commission (lowest!)', included: true, highlight: true },
      { text: 'Dedicated account manager', included: true, highlight: true },
      { text: 'All features included', included: true, highlight: true },
      { text: 'Auction products', included: true, highlight: false },
      { text: '30-day free trial', included: true, highlight: true }
    ]
  }
];

async function seedPlans() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MongoDB URI not found in environment variables');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Check if plans already exist
    const existingPlans = await SubscriptionPlanModel.countDocuments();
    if (existingPlans > 0) {
      console.log(`Found ${existingPlans} existing plans.`);
      const answer = process.argv.includes('--force') ? 'y' : 'n';
      
      if (answer === 'y' || process.argv.includes('--force')) {
        console.log('Deleting existing plans...');
        await SubscriptionPlanModel.deleteMany({});
        console.log('Existing plans deleted.');
      } else {
        console.log('Use --force flag to replace existing plans.');
        console.log('Exiting...');
        process.exit(0);
      }
    }
    
    // Insert new plans
    console.log('Creating subscription plans...');
    for (const planData of subscriptionPlans) {
      const plan = new SubscriptionPlanModel(planData);
      await plan.save();
      console.log(`✓ Created: ${plan.name} plan`);
    }
    
    console.log('\n========================================');
    console.log('✅ All subscription plans created successfully!');
    console.log('========================================\n');
    
    // Show summary
    console.log('Plan Summary:');
    console.log('─────────────────────────────────────────────────────');
    console.log('Tier       | Monthly | Yearly | Commission | Products');
    console.log('─────────────────────────────────────────────────────');
    for (const plan of subscriptionPlans) {
      const products = plan.limits.maxProducts === -1 ? 'Unlimited' : plan.limits.maxProducts;
      console.log(
        `${plan.name.padEnd(10)} | $${String(plan.pricing.monthly).padEnd(5)} | $${String(plan.pricing.yearly).padEnd(5)} | ${plan.commission.rate}%`.padEnd(10) + ` | ${products}`
      );
    }
    console.log('─────────────────────────────────────────────────────\n');
    
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedPlans();

