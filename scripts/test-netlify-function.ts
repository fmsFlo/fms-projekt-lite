import fetch from 'node-fetch'

async function testLeadsFunction() {
  const testData = {
    email: 'test@example.com',
    name: 'Test User',
    phone: '123456789',
    close_lead_id: 'lead_123',
    status: 'NEW',
    source: 'make_test'
  }

  console.log('🧪 Testing Netlify Function...')
  console.log('📤 Sending:', testData)

  try {
    // Test against local Netlify Dev
    const response = await fetch('http://localhost:8888/.netlify/functions/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const result = await response.json()

    console.log('\n📥 Response Status:', response.status)
    console.log('📥 Response Body:', JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('\n✅ Test PASSED!')
    } else {
      console.log('\n❌ Test FAILED!')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testLeadsFunction()

