
const uploadBtn=document.getElementById('upload');

uploadBtn.addEventListener('click', async ()=>{
    const dayInput= document.getElementById('day').value;
    const promptInput= document.getElementById('prompt').value;
    const promptsDiv= document.getElementById('prompts')

    if(dayInput === '' || promptInput === ''){
        alert("inputs are empty")
    }

    fetch('/dailyPrompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {dayInput, promptInput}
    })
    .then(response => response.json)
    .then(data =>{
        const prompts= data.prompt;
        console.log(prompts)

        prompts.forEach(prompt => {
            const dayElement= document.createElement("h3");
            dayElement.textContent= prompt.day;

            const actualPrompt= document.createElement('p');
            actualPrompt.textContent= prompt.prompt;


            const container= document.createElement('div');
            container.appendChild(dayElement);
            container.appendChild(actualPrompt);


            promptsDiv.appendChild(container)
        });
    })
    .catch(error => {
        console.error('Error validating token:', error);
        // Handle server error gracefully (e.g., display a message and retry)
        alert('server error!!');
      })
})