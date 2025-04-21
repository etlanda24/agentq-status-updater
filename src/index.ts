export async function hitExampleEndpoint(param: string) {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/1`, {
      headers: {
        "Content-Type": "application/json"
      }
    });
  
    if (!res.ok) {
      throw new Error(`Failed with status ${res.status}`);
    }
    
    return res.json();
  }
  