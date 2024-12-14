import { levels } from './levels.js';

function addButton(text, id, onclick) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.innerHTML = text;
    document.getElementById('buttonContainer').appendChild(btn);
    btn.addEventListener('click', onclick);
}
  

export function buildUi(preferences, selectLevel, update) {

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

  