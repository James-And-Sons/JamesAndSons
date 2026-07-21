async function probe() {
  const appId = '361708a904a4848921b9a585152315636960';
  const dummySecret = 'dummy_secret_value';
  const authHeader = 'Basic ' + Buffer.from(`${appId}:${dummySecret}`).toString('base64');

  console.log('--- Probing Flipkart OAuth Token Endpoint ---');

  // Probe 1: GET
  try {
    console.log('\n[Probe 1] Sending GET request...');
    const resGet = await fetch('https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_api', {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    console.log(`GET Status: ${resGet.status} ${resGet.statusText}`);
    const textGet = await resGet.text();
    console.log('GET Response (first 200 chars):', textGet.slice(0, 200));
  } catch (err: any) {
    console.error('GET Request failed:', err.message);
  }

  // Probe 2: POST
  try {
    console.log('\n[Probe 2] Sending POST request...');
    const resPost = await fetch('https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_api', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      }
    });
    console.log(`POST Status: ${resPost.status} ${resPost.statusText}`);
    const textPost = await resPost.text();
    console.log('POST Response (first 200 chars):', textPost.slice(0, 200));
  } catch (err: any) {
    console.error('POST Request failed:', err.message);
  }
}

probe();
