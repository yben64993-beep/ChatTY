

const KEY = 'ails_17f74a757b17d42145b98386210d45c06a4c0e88884d7b1be52617de7280e1e3';
const URL = 'https://attached-assets--bensoltanyousse.replit.app/api/chat';

const payloads = [
  { messages: [{ role: 'user', content: 'hi' }] },
  { message: 'hi' },
  { prompt: 'hi' },
  { text: 'hi' },
  { q: 'hi' },
  { query: 'hi' },
  { messages: [{ role: 'user', content: 'hi' }], model: 'meta-llama/llama-3.3-70b-instruct' },
  { messages: [{ role: 'user', content: 'hi' }], stream: false },
  { messages: [{ role: 'user', content: 'hi' }], model: 'meta-llama/llama-3.3-70b-instruct', stream: false },
  { content: 'hi' }
];

async function test() {
  for (let i = 0; i < payloads.length; i++) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloads[i])
    });
    const text = await res.text();
    console.log(`Payload ${i}: ${JSON.stringify(payloads[i])}`);
    console.log(`Response: ${res.status} - ${text}\n`);
    if (res.status === 200) {
      console.log('SUCCESS!');
      break;
    }
  }
}

test();
