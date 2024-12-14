import { levels } from './levels.js';

function addButton(text, id, onclick) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.innerHTML = text;
    document.getElementById('buttonContainer').appendChild(btn);
    btn.addEventListener('click', onclick);
}

function createLevelSeedInput(seedEventListener) {
  // Assume that there is a div in the HTML with the id "buttonContainer"
  const container = document.getElementById('buttonContainer');
  
  // Create an input element
  const input = document.createElement('input');
  input.type = 'number';
  input.id = 'levelSeed';
  input.placeholder = 'Set level seed for random level...';
  
  // Create a button element
  const button = document.createElement('button');
  button.id = 'levelSeedSubmit';
  button.textContent = 'Set seed';
  
  // Add the event listener to the button
  button.addEventListener('click', e => {
    seedEventListener(parseInt(input.value));
  });
  
  // Append the elements into the container
  container.appendChild(input);
  container.appendChild(button);
}


export function buildUi(preferences, selectLevel, update, createRandomLevel) {

    createLevelSeedInput(seed => {
      createRandomLevel(seed)
    });

    addButton('play lvl1', 'lvl1Select', e => {
        selectLevel(1);

    });
    
    addButton('play lvl2', 'lvl2Select', e => {
        selectLevel(2);
    });
    
    addButton('play lvl3', 'lvl3Select', e => {
        selectLevel(3);
    });

    addButton('play lvl4', 'lvl4Select', e => {
        selectLevel(4);
    });
    
    addButton('pause', 'pauseButton', e => {
      preferences.paused = !preferences.paused;
      e.target.innerHTML = preferences.paused ? 'play' : 'pause';
      if (!preferences.paused) {
        update();
      }
    });
    
    addButton('toggle "ai"', 'jumpToggleButton', e => {
      preferences.jumping = !preferences.jumping;
    });
    
    addButton('toggle debug', 'debugToggleButton', e => {
      preferences.drawDebug = !preferences.drawDebug;
    });
}

  