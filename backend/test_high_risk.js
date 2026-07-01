const highRiskCategories = ['Power Outage', 'Sewage/Drains', 'Road Damage'];
const highRiskKeywords = ['danger', 'hazard', 'emergency', 'fire', 'explosion', 'shock', 'electric', 'injury', 'exposed', 'critical', 'immediate', 'poison', 'toxic', 'wires', 'gas'];

function testLogic(type, description, nearbyCount) {
    const descriptionLower = description.toLowerCase();
    const containsHighRiskKeyword = highRiskKeywords.some(keyword => descriptionLower.includes(keyword));
    const isHighRiskCategory = highRiskCategories.includes(type);

    const isHighRisk = nearbyCount >= 2 || isHighRiskCategory || containsHighRiskKeyword;
    
    console.log(`Testing: [Type: ${type}] [Desc: ${description}] [Nearby: ${nearbyCount}]`);
    console.log(`Result: High Risk = ${isHighRisk} (Category: ${isHighRiskCategory}, Keyword: ${containsHighRiskKeyword}, Nearby: ${nearbyCount >= 2})`);
    console.log('---');
    return isHighRisk;
}

// Case 1: High risk category
testLogic('Power Outage', 'The power is out in my street.', 0);

// Case 2: High risk keyword
testLogic('Waste Issue', 'There is a dangerous pile of trash near the school.', 0);

// Case 3: Nearby reports
testLogic('Water Leak', 'Small leak in the pipe.', 2);

// Case 4: Normal report
testLogic('Water Leak', 'Small leak in the pipe.', 0);

// Case 5: Keyword with different casing
testLogic('Other', 'EMERGENCY: Gas smell detected!', 0);
