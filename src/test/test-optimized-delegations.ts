/**
 * Test file for the new optimized delegations function
 * Use this to test the getDelegationsWithFilters function
 */

import { 
  getDelegationsWithFilters, 
  type OptimizedDelegationFilters,
  clearAllCaches 
} from '../lib/get-delegations';

/**
 * Test the optimized delegations function with different filter configurations
 */
export async function testOptimizedDelegations() {
  console.log('🚀 Starting optimized delegations test...');
  
  const username = 'example-curator'; // Change this to test with different users
  
  try {
    // Clear caches to ensure fresh data
    clearAllCaches();
    
    // Test 1: Recent delegations (7 days)
    console.log('\n📋 Test 1: Recent delegations (7 days)');
    const filters7d: OptimizedDelegationFilters = {
      timePeriod: 7,
      minimumHP: 0,
      excludedUsers: []
    };
    
    const startTime = Date.now();
    const result7d = await getDelegationsWithFilters(username, filters7d);
    const executionTime7d = Date.now() - startTime;
    
    console.log(`✅ Results for 7-day filter:`);
    console.log(`   ⏱️ Execution time: ${executionTime7d}ms`);
    console.log(`   👥 Active delegators: ${result7d.totalDelegators}`);
    console.log(`   💰 Total HP: ${result7d.totalDelegationsHP.toFixed(2)}`);
    console.log(`   🚫 Excluded: ${result7d.excludedDelegators.length}`);
    console.log(`   ⬇️ Below minimum: ${result7d.belowMinimumDelegators.length}`);
    
    // Show top 5 delegators with percentages
    console.log(`   🔝 Top 5 delegators:`);
    result7d.activeDelegations.slice(0, 5).forEach((d, i) => {
      console.log(`      ${i + 1}. @${d.delegator}: ${d.currentHP.toFixed(2)} HP (${d.participationPercentage.toFixed(2)}%)`);
    });
    
    // Test 2: With minimum HP filter
    console.log('\n📋 Test 2: With minimum HP filter (100 HP minimum)');
    const filtersMinHP: OptimizedDelegationFilters = {
      timePeriod: 7,
      minimumHP: 100,
      excludedUsers: []
    };
    
    const startTimeMinHP = Date.now();
    const resultMinHP = await getDelegationsWithFilters(username, filtersMinHP);
    const executionTimeMinHP = Date.now() - startTimeMinHP;
    
    console.log(`✅ Results with 100 HP minimum:`);
    console.log(`   ⏱️ Execution time: ${executionTimeMinHP}ms`);
    console.log(`   👥 Active delegators: ${resultMinHP.totalDelegators}`);
    console.log(`   💰 Total HP: ${resultMinHP.totalDelegationsHP.toFixed(2)}`);
    console.log(`   🚫 Filtered by minimum: ${resultMinHP.belowMinimumDelegators.length}`);
    
    // Test 3: With exclusions
    console.log('\n📋 Test 3: With user exclusions');
    const filtersExcluded: OptimizedDelegationFilters = {
      timePeriod: 7,
      minimumHP: 0,
      excludedUsers: ['repollo', 'faffy'] // Example exclusions
    };
    
    const startTimeExcluded = Date.now();
    const resultExcluded = await getDelegationsWithFilters(username, filtersExcluded);
    const executionTimeExcluded = Date.now() - startTimeExcluded;
    
    console.log(`✅ Results with exclusions:`);
    console.log(`   ⏱️ Execution time: ${executionTimeExcluded}ms`);
    console.log(`   👥 Active delegators: ${resultExcluded.totalDelegators}`);
    console.log(`   💰 Total HP: ${resultExcluded.totalDelegationsHP.toFixed(2)}`);
    console.log(`   🚫 Excluded users: ${resultExcluded.excludedDelegators.length}`);
    console.log(`   📝 Excluded list: ${resultExcluded.excludedDelegators.join(', ')}`);
    
    // Test 4: Performance test with 30-day period
    console.log('\n📋 Test 4: Extended period performance test (30 days)');
    const filters30d: OptimizedDelegationFilters = {
      timePeriod: 30,
      minimumHP: 0,
      excludedUsers: []
    };
    
    const startTime30d = Date.now();
    const result30d = await getDelegationsWithFilters(username, filters30d);
    const executionTime30d = Date.now() - startTime30d;
    
    console.log(`✅ Results for 30-day period:`);
    console.log(`   ⏱️ Execution time: ${executionTime30d}ms`);
    console.log(`   👥 Active delegators: ${result30d.totalDelegators}`);
    console.log(`   💰 Total HP: ${result30d.totalDelegationsHP.toFixed(2)}`);
    console.log(`   📊 Operations found: ${result30d.metadata.totalOperationsFound}`);
    console.log(`   📈 Time range: ${result30d.metadata.timeRangeStart} to ${result30d.metadata.timeRangeEnd}`);
    
    // Summary comparison
    console.log('\n📊 PERFORMANCE SUMMARY:');
    console.log(`   🕐 7-day test: ${executionTime7d}ms`);
    console.log(`   🕐 Min HP test: ${executionTimeMinHP}ms`);
    console.log(`   🕐 Excluded test: ${executionTimeExcluded}ms`);
    console.log(`   🕐 30-day test: ${executionTime30d}ms`);
    
    const avgTime = (executionTime7d + executionTimeMinHP + executionTimeExcluded + executionTime30d) / 4;
    console.log(`   📈 Average execution time: ${avgTime.toFixed(2)}ms`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Helper function to test a specific user's delegations
 */
export async function testSpecificUser(username: string) {
  console.log(`🔍 Testing delegations for @${username}...`);
  
  const filters: OptimizedDelegationFilters = {
    timePeriod: 7,
    minimumHP: 1, // At least 1 HP to filter out zero delegations
    excludedUsers: []
  };
  
  try {
    const result = await getDelegationsWithFilters(username, filters);
    
    console.log(`📋 Results for @${username}:`);
    console.log(`   👥 Active delegators: ${result.totalDelegators}`);
    console.log(`   💰 Total HP: ${result.totalDelegationsHP.toFixed(2)}`);
    console.log(`   📊 Metadata:`, result.metadata);
    
    if (result.activeDelegations.length > 0) {
      console.log(`   🔝 Sample delegations:`);
      result.activeDelegations.slice(0, 3).forEach((d, i) => {
        console.log(`      ${i + 1}. @${d.delegator}: ${d.currentHP.toFixed(2)} HP (${d.participationPercentage.toFixed(2)}%) - ${d.timestamp}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error testing @${username}:`, error);
    throw error;
  }
}

// Auto-run test if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('🧪 Optimized delegations test module loaded');
  console.log('Run testOptimizedDelegations() to start testing');
  console.log('Run testSpecificUser("username") to test a specific user');
}
