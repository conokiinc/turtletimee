/* =====================================================================
   content.js — ALL the words in the game live here.
   Edit dialogue, tutorial signs, achievements and quotes in this file;
   no other code needs to change. Speakers:
     duck  — Duckquackquack      tt   — Turtletimee
     narr  — Narrator            (mood: talk / shout / hero / idle / cool)
   A `tag` shows under the speaker's name, e.g. "(behind the door)".
   ===================================================================== */
(function (G) {
  'use strict';
  const C = {};

  C.TITLE = "WHERE'S TURTLETIMEE?";
  C.SUBTITLE = 'THE GREAT RESCUE';
  C.CREDIT = 'A DUCKQUACKQUACK STUDIOS PRODUCTION';

  C.NAMES = { duck: 'DUCKQUACKQUACK', tt: 'TURTLETIMEE', narr: 'NARRATOR' };

  /* ---------------- opening story ---------------- */
  C.OPENING = [
    { who: 'narr', text: 'It was supposed to be another ordinary day.' },
    { who: 'narr', text: 'Duckquackquack was minding his own business when he noticed something strange.' },
    { who: 'duck', mood: 'talk', text: '...Hm.' },
    { who: 'narr', text: 'Turtletimee was nowhere to be found.' },
    { who: 'duck', mood: 'shout', text: 'QIQI???' },
    { who: 'duck', mood: 'talk', text: 'Her sunglasses are gone. Her slippers are gone. Her whole vibe is gone.' },
    { who: 'duck', mood: 'hero', text: 'This can only mean one thing. A RESCUE MISSION.' },
    { who: 'narr', text: 'Nobody had asked for a rescue mission.' },
    { who: 'narr', text: 'And so, our brave duck began his journey.' },
  ];

  /* ---------------- World 1 ---------------- */
  C.W1 = {
    title: 'THE SLIPPER HEIST', number: 'WORLD 1',
    goal: 'Find all five slippers, then reach the shower door.',
    intro: [
      { who: 'duck', mood: 'talk', text: 'Clue number one: her slippers are missing.' },
      { who: 'duck', mood: 'talk', text: 'Okay. I stole them. Last week. As a joke.' },
      { who: 'duck', mood: 'shout', text: 'BUT I HID THEM SOMEWHERE SENSIBLE AND NOW THEY ARE EVERYWHERE.' },
      { who: 'duck', mood: 'hero', text: 'Five slippers. One shower door. Let\'s go.' },
    ],
    // tutorial plaques on the wall (index = T marker order in the level)
    signs: [
      'A / D  or  ← →   waddle',
      'SPACE   jump  ·  hold it to jump higher',
      'J  or  LEFT CLICK   throw a knife',
      'Curtain in the way?  Knife it.',
      'SHIFT   panic-sprint  (go fast, think less)',
      'Puddles slow you down. Soap is slippery.',
      'Shampoo bottles are bouncy',
      'Towel rack = checkpoint',
      'Soap bubbles hurt.  Pop them with knives.',
    ],
    // Turtletimee's sticky notes (index = N marker order)
    notes: [
      [{ who: 'tt', tag: '(sticky note)', text: 'If you are reading this, you are in my bathroom. Leave.' },
        { who: 'duck', mood: 'talk', text: 'Rude. Accurate. But rude.' }],
      [{ who: 'tt', tag: '(sticky note)', text: 'The floor is wet because I showered. For forty minutes. It\'s called self-care.' },
        { who: 'duck', mood: 'shout', text: 'FORTY MINUTES??' }],
      [{ who: 'tt', tag: '(sticky note)', text: 'Do not touch the soap. The soap is slippery.' },
        { who: 'tt', tag: '(sticky note, continued)', text: 'You are going to touch the soap.' },
        { who: 'duck', mood: 'hero', text: 'I am going to touch the soap.' }],
      [{ who: 'tt', tag: '(sticky note)', text: 'Stop counting my slippers out loud. I can hear you.' },
        { who: 'duck', mood: 'shout', text: 'ONE. TWO. THREE—' }],
      [{ who: 'tt', tag: '(sticky note)', text: 'Do not open the shower door.' },
        { who: 'duck', mood: 'hero', text: 'Opening the shower door.' }],
    ],
    curtainFirst: [{ who: 'duck', mood: 'talk', text: 'Sorry, curtain. It\'s a rescue.' }],
    slipperLines: [
      'ONE SLIPPER!',
      'Two. TWO SLIPPERS.',
      'Three! I\'m basically a detective.',
      'Four. Which absolute menace hid these?? ...Oh right. Me.',
      'FIVE! She has two feet. I have questions.',
    ],
    lockedDoor: [
      { who: 'duck', mood: 'talk', text: 'Locked. Of course it\'s locked.' },
      { who: 'duck', mood: 'talk', text: 'It probably opens for whoever brings back ALL the slippers.' },
    ],
    poster: [
      { who: 'narr', text: 'A poster. It reads: "JOIN THE CULT. Duck Quack Quack is the savior & lord of us all."' },
      { who: 'duck', mood: 'hero', text: 'Finally. Some well-researched journalism.' },
    ],
    checkpointFirst: [{ who: 'duck', mood: 'talk', text: 'A towel! Fluffy. Safe. Checkpoint.' }],
    door: [
      { who: 'duck', mood: 'shout', text: 'QIQI. I know you\'re in there. You\'ve been in there for FORTY MINUTES.' },
      { who: 'tt', tag: '(behind the door)', text: 'It\'s called self-care.' },
      { who: 'duck', mood: 'talk', text: 'I found your slippers.' },
      { who: 'tt', tag: '(behind the door)', text: '...' },
      { who: 'tt', tag: '(behind the door)', text: 'Which ones?' },
      { who: 'duck', mood: 'shout', text: 'ALL FIVE.' },
      { who: 'tt', tag: '(behind the door)', text: 'I have two feet.' },
      { who: 'duck', mood: 'shout', text: 'OPEN. THE. DOOR.' },
    ],
    doorOpen: [
      { who: 'narr', text: 'The shower was empty. On the soap shelf, a tiny speaker was still playing.' },
      { who: 'tt', mood: 'cool', tag: '(pre-recorded)', text: 'If you can hear this, you fell for it.' },
      { who: 'duck', mood: 'shout', text: 'A DIVERSION??' },
      { who: 'duck', mood: 'talk', text: '...' },
      { who: 'duck', mood: 'talk', text: 'Found them. Finally.' },
      { who: 'narr', text: 'One mystery solved. Unfortunately, the turtle was still missing.' },
    ],
    toWorld2: [
      { who: 'duck', mood: 'talk', text: 'This speaker smells like chlorine.' },
      { who: 'duck', mood: 'hero', text: 'She\'s at the POOL.' },
    ],
  };

  /* ---------------- World 2 ---------------- */
  C.W2 = {
    title: 'THE GREAT SWIM', number: 'WORLD 2',
    goal: 'Reach the finish wall before the timer runs out.',
    intro: [
      { who: 'narr', text: 'The pool. Bright, blue, and smelling aggressively of chlorine.' },
      { who: 'duck', mood: 'shout', text: 'QIQI!' },
      { who: 'tt', tag: '(already in the water)', text: 'Oh. It\'s you.' },
      { who: 'duck', mood: 'shout', text: 'EVERYONE IS LOOKING FOR YOU.' },
      { who: 'tt', text: 'Nobody is looking for me. You are looking for me.' },
      { who: 'duck', mood: 'talk', text: 'Same thing.' },
      { who: 'tt', text: 'Race you to the other end. If you win, I\'ll come home.' },
      { who: 'duck', mood: 'hero', text: 'I have never lost a swimming race in my life.' },
      { who: 'tt', text: 'You have lost every swimming race in your life.' },
      { who: 'duck', mood: 'shout', text: 'ON YOUR MARKS.' },
    ],
    // tutorial plaques under the water (index = sign order in the level)
    signs: [
      'W A S D  or  arrows   swim in any direction',
      'SPACE   boost  (uses one bubble charge)',
      'Swim through air bubbles to refill boost',
      'Currents push you.  Ride the fast lanes.',
      'Bonking into things costs 2 seconds',
      'Jets pulse on and off.  Wait for a gap.',
      'Stopwatches add time',
      'Pass a buoy line for more time',
      'Swim through the diving rings: +1 second each',
    ],
    // short lines spoken mid-race (they don't stop the race)
    barksTT: ['You\'re in my lane.', 'Swim faster.', 'I\'m not racing you. I\'m just faster.', 'This is my pool now.', 'Keep up, duck.', 'Don\'t touch the drain.', 'You look like a sock in a washing machine.'],
    barksTTWait: ['...', 'I\'ll wait.', 'Take your time. Actually, don\'t.'],
    barksDuck: ['WAIT FOR MEEE', 'I AM A DUCK. THIS IS MY ELEMENT.', 'Why is the water so WET', 'SO MUCH CHLORINE', 'I can see the bottom of the pool AND my life choices'],
    barkBonk: ['OW.', 'My beak!', 'Who put that THERE', 'Rude noodle.'],
    barkBoost: ['ZOOM', 'NYOOOM', 'TURBO DUCK'],
    timeUp: 'OUT OF TIME',
    tunnel: [{ who: 'duck', mood: 'talk', text: 'A tunnel. With a current. This is either a shortcut or a terrible mistake.' }],
    mural: [
      { who: 'narr', text: 'Someone has drawn on the tiles down here. A turtle, a canal, a bus stop.' },
      { who: 'narr', text: '"*swims faster than bus"' },
      { who: 'duck', mood: 'talk', text: '...' },
      { who: 'duck', mood: 'talk', text: 'Unfortunately accurate.' },
    ],
    // finish: who touched the wall first
    finishTTFirst: [
      { who: 'tt', tag: '(at the wall)', text: 'Took you long enough.' },
      { who: 'duck', mood: 'shout', text: 'I WAS PACING MYSELF.' },
      { who: 'tt', text: 'You were drowning slowly.' },
      { who: 'tt', text: 'Anyway. I\'m going home.' },
      { who: 'duck', mood: 'shout', text: 'WAIT—' },
      { who: 'narr', text: 'Turtletimee was gone. Somehow. She is surprisingly fast.' },
    ],
    finishDuckFirst: [
      { who: 'tt', tag: '(touching the wall second)', text: '...' },
      { who: 'duck', mood: 'shout', text: 'I WON. I WON!! YOU HAVE TO COME HOME.' },
      { who: 'tt', text: 'I let you win.' },
      { who: 'duck', mood: 'shout', text: 'YOU DID NOT.' },
      { who: 'tt', text: 'I\'m still going home. Alone. Bye.' },
      { who: 'narr', text: 'Turtletimee was gone. Somehow. She is surprisingly fast.' },
    ],
    vendingYes: [
      { who: 'narr', text: 'Next to the pool, the vending machine glows. Duckquackquack feeds it five tokens.' },
      { who: 'narr', text: '*clunk*' },
      { who: 'duck', mood: 'hero', text: 'GOGGLES. I can see EVERYTHING now.' },
    ],
    vendingNo: [
      { who: 'narr', text: 'The poolside vending machine blinks: INSERT 5 TOKENS.' },
      { who: 'duck', mood: 'talk', text: 'I have {n}. It has standards.' },
    ],
    floatie: [
      { who: 'narr', text: 'Some time later, a duck lay on a floatie under the hot sun.' },
      { who: 'duck', mood: 'talk', text: 'Okay. That was actually quite tiring.' },
      { who: 'narr', text: 'But there was one more obstacle ahead.' },
    ],
  };
  /* ---------------- World 3 ---------------- */
  C.W3 = {
    title: 'INK OR SINK', number: 'WORLD 3',
    goal: 'Cover 60% of the arena in your ink before time runs out.',
    intro: [
      { who: 'narr', text: 'The trail led to an arena behind Turtletimee\'s house. Paint on the floor. Speakers on the walls. A giant screen, switched off.' },
      { who: 'narr', text: 'The screen flickers on.' },
      { who: 'tt', mood: 'cool', tag: '(on the big screen)', text: 'Welcome to my arena.' },
      { who: 'duck', mood: 'shout', text: 'QIQI?? WHY ARE YOU ON A SCREEN.' },
      { who: 'tt', mood: 'cool', tag: '(streaming)', text: 'I\'m streaming. Say hi to chat.' },
      { who: 'duck', mood: 'talk', text: '...hi chat.' },
      { who: 'tt', mood: 'cool', text: 'Cover more than sixty percent of the floor in your ink and I\'ll tell you where I am.' },
      { who: 'tt', mood: 'cool', text: 'My minions will be painting too. They\'re called Smudges. They\'re very loyal.' },
      { who: 'duck', mood: 'hero', text: 'Easy. I\'m basically an artist.' },
      { who: 'tt', mood: 'cool', text: 'You drew a duck holding a knife. On a T-shirt.' },
      { who: 'duck', mood: 'shout', text: 'AND IT WAS ICONIC.' },
      { who: 'tt', mood: 'cool', text: 'Begin.' },
    ],
    signs: [
      'W A S D   move',
      'MOUSE   aim   ·   LEFT CLICK (hold)   paint',
      'Standing on your ink refills it faster',
      'Paint to charge KNIVES   ·   SPACE to unleash',
      'Pop Smudges with ink. Their ink slows you down.',
    ],
    // non-blocking lines that appear on the big screen
    barksTT: ['Chat says you\'re losing.', 'Nice ink. Mine\'s nicer.', 'My minions are unionising.', 'SHADERMAXPOWER is typing...', 'Is that the best you can do?', 'I\'m eating crackers. Continue.', 'That corner is mine now.'],
    barksTTPop: ['Leave my Smudges alone.', 'That Smudge had a family.', 'Rude.'],
    barksDuck: ['INK. EVERYWHERE.', 'I AM PICASSO', 'TAKE THAT, SMUDGE', 'ARTIST AT WORK', 'This is my canvas now'],
    special: 'KNIVES UP MY SLEEVE!',
    phase2: 'Okay. Fine.',
    phase2b: 'EMOTIONAL DAMAGE: unlocked.',
    phase3: 'Fine. I\'ll actually try now.',
    screenHit: 'Stop shooting my screen.',
    chat: [
      'duckfan_07: W', 'chat: is he ok', 'turtletimee merch drop when', 'POGGBOI13000 has entered the chat',
      'swims_faster_than_bus: hi', 'lurker: the duck is losing it', 'emotional_damage_bot: incoming', 'chat: KNIVES KNIVES KNIVES',
      'slipper_thief: ...', 'mod: please stop spamming corn', 'chat: 1kg of corn', 'tt_hater: (banned)',
      'chat: go duck go', 'chat: she is so unbothered', 'it\'s turtletimee.', 'chat: who drew this duck',
    ],
    secret: [
      { who: 'narr', text: 'Under the ink, something was written on the floor...' },
    ],
    win: [
      { who: 'tt', mood: 'cool', tag: '(on the big screen)', text: '...' },
      { who: 'tt', mood: 'cool', text: 'GG.' },
      { who: 'tt', mood: 'cool', text: 'Fine. I\'m at home. Obviously. Where else would I be.' },
      { who: 'duck', mood: 'shout', text: 'YOU COULD HAVE SAID THAT AT THE START.' },
      { who: 'tt', mood: 'cool', text: 'You didn\'t ask. Ending stream.' },
      { who: 'narr', text: 'The screen went dark.' },
      { who: 'duck', mood: 'hero', text: 'Finally. Something I\'m good at.' },
      { who: 'narr', text: 'With all three challenges behind him, Duckquackquack had finally reached the last known location of Turtletimee.' },
    ],
    lose: 'Sink.',
  };
  C.W4 = { title: 'THE FINAL ENCOUNTER', number: 'FINALE', goal: 'Find Turtletimee.' };

  C.HOWTO_INK = [
    ['Move', 'W A S D  or  arrow keys'],
    ['Aim', 'mouse'],
    ['Paint', 'hold left click  (or J)'],
    ['Knives Up My Sleeve', 'Space, when the KNIVES bar is full'],
  ];

  C.HOWTO_SWIM = [
    ['Swim', 'W A S D  or  arrow keys (any direction)'],
    ['Boost', 'Space (uses one bubble charge)'],
    ['Refill boost', 'swim through air bubbles'],
    ['Pause', 'Esc  or  P'],
  ];

  /* ---------------- quotes (exact wording — do not edit) ---------------- */
  C.QUOTES = [
    { id: 'q1', world: 1, text: '1 + 1 = 3 ~that damn dumb toddler' },
    { id: 'q2', world: 2, text: 'how dare you, I AM THE 5 YEAR OLD' },
    { id: 'q3', world: 3, text: '3 divide by 3 = 0' },
    { id: 'q4', world: 4, text: 'Qiqi can f**k herself I like turtletimee' },
  ];

  /* ---------------- achievements ---------------- */
  C.ACHIEVEMENTS = [
    { id: 'w1_clear', name: 'The Slipper Heist', desc: 'Finish World 1.' },
    { id: 'w1_nodmg', name: 'Squeaky Clean', desc: 'Finish World 1 without taking damage.' },
    { id: 'w1_corn', name: '1kg of Corn', desc: 'Collect every corn kernel in World 1.' },
    { id: 'w1_cult', name: 'Join the Cult', desc: 'Find the secret poster in World 1.' },
    { id: 'w1_pop', name: 'Pop Culture', desc: 'Pop 10 soap bubbles in World 1.' },
    { id: 'w1_fast', name: 'Late for Class', desc: 'Finish World 1 in under 3:30.' },
    { id: 'knives', name: 'aka knives :>', desc: 'Throw 50 knives.' },
    { id: 'quote1', name: 'Words of Wisdom', desc: 'Find a hidden quote.' },
    { id: 'w2_clear', name: 'The Great Swim', desc: 'Finish World 2.' },
    { id: 'w2_beat', name: 'Faster Than a Turtle', desc: 'Touch the wall before Turtletimee.' },
    { id: 'w2_tokens', name: 'Vending Machine Enjoyer', desc: 'Collect all 5 pool tokens (unlocks swim goggles).' },
    { id: 'w2_bus', name: 'Faster Than Bus', desc: 'Find the drawing hidden under the tunnel.' },
    { id: 'w2_clean', name: 'No Bonks Given', desc: 'Finish World 2 without bonking into anything.' },
    { id: 'quote2', name: 'More Words of Wisdom', desc: 'Find the hidden quote in World 2.' },
    { id: 'w3_clear', name: 'Ink or Sink', desc: 'Finish World 3.' },
    { id: 'w3_fast', name: 'Speed Painter', desc: 'Cover 60% of the arena with over 60 seconds left.' },
    { id: 'w3_knives', name: 'Knives Up My Sleeve', desc: 'Use Duck\'s special three times in one match.' },
    { id: 'w3_screen', name: 'Stop Shooting My Screen', desc: 'Hit Turtletimee\'s big screen 10 times.' },
    { id: 'w3_stable', name: 'Emotionally Stable', desc: 'Finish World 3 without being hit by EMOTIONAL DAMAGE.' },
    { id: 'quote3', name: 'Even More Words of Wisdom', desc: 'Find the hidden quote in World 3.' },
    { id: 'found', name: 'Turtletimee Has Been Found', desc: 'Finish the final encounter.' },
    { id: 'quote4', name: 'The Last Word', desc: 'Find the hidden quote at Turtletimee\'s house.' },
    { id: 'nosy', name: 'Nosy Neighbour', desc: 'Look at everything outside Turtletimee\'s house.' },
    { id: 'wish', name: 'Make a Wish', desc: 'Blow out the birthday candles.' },
    { id: 'letter', name: 'Plot Twist', desc: 'Read the letter.' },
    { id: 'archive', name: 'Archivist', desc: 'Open the character archive.' },
  ];

  /* ---------------- the final encounter ---------------- */
  C.FINAL = {
    number: 'FINALE', title: 'THE FINAL ENCOUNTER', goal: 'Find Turtletimee.',
    arrive: [
      { who: 'narr', text: 'The last known location of Turtletimee.' },
      { who: 'narr', text: 'Her house.' },
      { who: 'duck', mood: 'shout', text: 'I KNEW IT.' },
      { who: 'duck', mood: 'hero', text: 'One bathroom. One pool. One arena. It all led here.' },
    ],
    hint: 'A / D  walk   ·   E  look / knock',
    // optional things to look at on the way to the door
    poster: [
      { who: 'narr', text: 'A poster on the lamp post: "MISSING: ONE (1) TURTLE. Answers to Qiqi. Probably at home. REWARD: 1kg of corn."' },
      { who: 'duck', mood: 'hero', text: 'I made these. Very accurate likeness.' },
      { who: 'duck', mood: 'talk', text: 'I put up forty of them. On this street. Outside her house.' },
    ],
    mailbox: [
      { who: 'narr', text: 'The mailbox is stuffed. A parcel labelled "TURTLETIMEE MERCH — ORDER #0001", and a pile of fan mail.' },
      { who: 'duck', mood: 'talk', text: 'Order number one. That was me. I\'m the customer base.' },
    ],
    mailboxQuote: [
      { who: 'narr', text: 'One of the letters has no name on it. It just says...' },
    ],
    mailboxAgain: [{ who: 'duck', mood: 'talk', text: 'The fan mail stays in the mailbox. I\'m not a monster.' }],
    window: [
      { who: 'narr', text: 'The lights are on. The TV is on.' },
      { who: 'narr', text: 'Somebody inside is eating crackers.' },
      { who: 'duck', mood: 'shout', text: 'SHE\'S BEEN HOME THIS WHOLE TIME??' },
    ],
    doormat: [{ who: 'narr', text: 'The doormat says: "it\'s turtletimee."' }, { who: 'duck', mood: 'talk', text: 'It is. It is turtletimee.' }],
    // the door: Ada's established dialogue, kept word for word
    door1: [
      { who: 'duck', mood: 'shout', text: 'QIQI. OPEN THE DOOR.' },
      { who: 'tt', tag: '(behind the door)', text: 'No.' },
      { who: 'duck', mood: 'shout', text: 'I WENT THROUGH THREE ENTIRE WORLDS.' },
      { who: 'tt', tag: '(behind the door)', text: 'Okay?' },
    ],
    door2: [
      { who: 'duck', mood: 'shout', text: 'I FOUND YOUR SLIPPERS.' },
      { who: 'tt', tag: '(behind the door)', text: '...' },
      { who: 'tt', tag: '(behind the door)', text: 'Which ones?' },
      { who: 'duck', mood: 'shout', text: 'THE ONES YOU LOST.' },
      { who: 'tt', tag: '(behind the door)', text: 'Fine.' },
    ],
    found: 'QUEST COMPLETE!', foundSub: 'TURTLETIMEE HAS BEEN FOUND.',
    // after the reunion
    reunion: [
      { who: 'tt', text: 'Hi.' },
      { who: 'duck', mood: 'shout', text: 'HI?? HI??? YOU LEFT A SPEAKER IN THE SHOWER.' },
      { who: 'tt', text: 'I wanted to see how far you\'d go.' },
      { who: 'duck', mood: 'shout', text: 'THREE WORLDS, QIQI. THREE.' },
    ],
    poolWon: [
      { who: 'tt', text: 'You beat me in the pool.' },
      { who: 'tt', text: 'Once.' },
      { who: 'duck', mood: 'hero', text: 'Once is a world record.' },
    ],
    poolLost: [
      { who: 'tt', text: 'Two and a half. You lost to me in the pool.' },
      { who: 'duck', mood: 'shout', text: 'I LET YOU WIN.' },
      { who: 'tt', text: 'That\'s my line.' },
    ],
    driving: [
      { who: 'duck', mood: 'hero', text: 'Remember who got you those driving lessons?' },
      { who: 'tt', text: 'I passed the test.' },
      { who: 'duck', mood: 'shout', text: 'AND WHO HELPED YOU GET THE TEST?' },
      { who: 'tt', text: 'You booked some lessons.' },
      { who: 'duck', mood: 'shout', text: 'I WAS THE ENTIRE LOGISTICS DEPARTMENT.' },
      { who: 'tt', text: '...' },
      { who: 'tt', text: 'You did help.' },
      { who: 'duck', mood: 'talk', text: '...did you just admit something' },
      { who: 'tt', mood: 'cool', text: 'No.' },
    ],
    leave: [
      { who: 'tt', text: 'So. Why did you actually come all this way?' },
      { who: 'duck', mood: 'talk', text: '...' },
      { who: 'duck', mood: 'talk', text: 'What\'s the date today.' },
      { who: 'tt', text: 'Why.' },
      { who: 'duck', mood: 'shout', text: 'NO REASON. STAY THERE. DON\'T MOVE.' },
      { who: 'tt', text: 'I live here.' },
    ],
  };

  /* ---------------- the birthday ---------------- */
  C.BDAY = {
    dark: [
      { who: 'narr', text: 'Turtletimee went back inside. All the lights were off.' },
      { who: 'tt', text: 'Duck.' },
      { who: 'tt', text: 'Why are my lights off.' },
      { who: 'duck', tag: '(somewhere in the dark)', mood: 'talk', text: 'shhhhhh' },
    ],
    banner: 'HAPPY 20TH BIRTHDAY',
    surprise: [
      { who: 'duck', mood: 'shout', text: 'SURPRISE!!! HAPPY BIRTHDAY QIQI!!!' },
      { who: 'tt', text: '...' },
      { who: 'tt', text: 'Was this whole rescue a birthday surprise?' },
      { who: 'duck', mood: 'hero', text: 'It was a rescue AND a surprise. Two-in-one. Very efficient.' },
      { who: 'tt', text: 'There\'s a knife in the cake.' },
      { who: 'duck', mood: 'talk', text: 'For cutting. I\'m not an animal.' },
      { who: 'duck', mood: 'shout', text: 'TWO CANDLES. SHAPED LIKE A TWENTY. MAKE A WISH.' },
    ],
    wishPrompt: 'Make a wish...',
    wishKeys: 'then press SPACE (or click) to blow out the candles',
    afterWish: [
      { who: 'duck', mood: 'shout', text: 'WHAT DID YOU WISH FOR.' },
      { who: 'tt', text: 'If I tell you, it won\'t come true.' },
      { who: 'duck', mood: 'talk', text: 'Is it about me.' },
      { who: 'tt', text: 'No.' },
      { who: 'duck', mood: 'hero', text: 'It\'s about me.' },
      { who: 'duck', mood: 'shout', text: 'OKAY. Before cake. I made a slideshow.' },
      { who: 'tt', text: 'Of course you did.' },
    ],
    memoriesTitle: 'EVIDENCE',
    memoriesHint: 'Enter / Space / click  ·  next',
    afterMemories: [
      { who: 'tt', text: '...You kept all of this?' },
      { who: 'duck', mood: 'hero', text: 'I keep everything. I\'m very sentimental. And a hoarder.' },
      { who: 'duck', mood: 'shout', text: 'ONE MORE THING. STAND STILL.' },
      { who: 'tt', text: 'I\'m always still.' },
    ],
    levelUp: {
      name: 'TURTLETIMEE', alias: 'SHADERMAXPOWER', from: 19, to: 20,
      stats: [
        ['Age', '19  →  20'],
        ['Emotional Damage', '+20'],
        ['Composure', 'still maximum'],
        ['Patience for Duck', '+1  (a rare stat)'],
        ['Maths', '1 + 1 = 3, 3 divide by 3 = 0  (unchanged)'],
      ],
      skill: 'NEW SKILL LEARNED: BEING TWENTY',
    },
    credits: [
      ['big', 'WHERE\'S TURTLETIMEE?'], ['sub', 'THE GREAT RESCUE'], ['gap'],
      ['mono', 'A DUCKQUACKQUACK STUDIOS PRODUCTION'], ['gap'], ['gap'],
      ['head', 'STARRING'],
      ['row', 'Duckquackquack', 'the protagonist (self-appointed)'],
      ['row', 'Turtletimee', 'herself'],
      ['row', 'The Smudges', 'loyal minions (unionised)'],
      ['row', 'Five slippers', 'the evidence'],
      ['row', 'A tiny shower speaker', 'the diversion'],
      ['gap'],
      ['head', 'ALSO STARRING'],
      ['row', 'The pool robots', 'obstacles'],
      ['row', 'Stream chat', 'unhelpful'],
      ['row', '1kg of corn', 'catering'],
      ['gap'],
      ['head', 'MADE BY'],
      ['row', 'Characters, story & art', 'Ada'],
      ['row', 'Turtletimee', 'Qiqi\'s character'],
      ['row', 'Knives', 'up his sleeve'],
      ['row', 'Emotional damage', 'SHADERMAXPOWER'],
      ['gap'],
      ['small', 'No turtles were harmed in the making of this game.'],
      ['small', 'Several slippers were.'],
      ['gap'], ['gap'],
    ],
    theEnd: 'THE END',
    twist: [
      { who: 'duck', tag: '(from somewhere below the credits)', mood: 'talk', text: '...wait.' },
      { who: 'duck', mood: 'shout', text: 'WAIT. DON\'T CLOSE THE TAB.' },
      { who: 'duck', mood: 'hero', text: 'Plot twist.' },
    ],
    envelopeTo: 'for tt-time',
    envelopeHint: 'Click the envelope (or press Enter) to open it',
    letterNext: 'keep reading',
    letterClose: 'Close the letter',
    letterEnd: 'Take your time.',
    after: [
      { who: 'duck', mood: 'talk', text: '...so.' },
      { who: 'duck', mood: 'talk', text: 'On a scale of one to ten. How much emotional damage.' },
    ],
    after2: [
      { who: 'tt', mood: 'cool', text: 'Zero.' },
      { who: 'duck', mood: 'shout', text: 'IT WORKED. IT TOTALLY WORKED.' },
      { who: 'tt', mood: 'cool', text: '...Thank you, Duck.' },
      { who: 'duck', mood: 'hero', text: 'Happy birthday, you old turtle.' },
    ],
    archiveCard: ['BONUS', 'CHARACTER ARCHIVE', 'Unlocked. Revisit the characters, the memories and the hidden quotes.'],
  };

  /* ---------------- Ada's birthday message ----------------
     Shown in full, exactly as written: do not edit, correct or shorten.
     One string per paragraph. */
  C.BIRTHDAY_MESSAGE = [
    "Dearest tt-time, I hope you had fun playing whatevert this random thing I made for you and that you appreciate my hardwork and absolute creativity that it took to make your gift :>",
    "I also hope that you half fell for my diversion at least as I too think I'm getting rather predictiable but hey, another plot twist! If you could even find this without me telling you~",
    "But in all seriousness, sad that I can't spend your birthday with you, I hope that all is well in singapore and that life is okay. We may not talk everyday, but I just want you to know that you still mean the world to me, and you is one of my closest friends okay? I ai ni duo le, please take good care of yourself and I'll catch up with you when I'm back in Singapore!",
    "Happy 20th birthday you old turtle :> May all your wishes come true, and be happy okay :)",
    "-Ada 2026"
  ];

  /* ---------------- memories (birthday slideshow + archive) ---------------- */
  C.MEMORIES = [
    { id: 'slippers', title: 'The Slipper Heist', text: 'He stole them as a joke. He hid them everywhere. He found all five.' },
    { id: 'bus', title: 'The Great Swim', text: 'swims faster than bus.' },
    { id: 'cult', title: 'Join the cult', text: 'Duck Quack Quack is the savior & lord of us all. (Source: Duck.)' },
    { id: 'driving', title: 'The driving licence saga', text: 'One of them booked the lessons. One of them passed the test.' },
    { id: 'vending', title: 'The vending machine plans', text: 'Automated. Revolutionary. Still in development.' },
    { id: 'merch', title: 'it\'s turtletimee.', text: 'Official merch. Order #0001 has shipped. Probably.' },
    { id: 'shirt', title: 'Two characters, one T-shirt', text: 'The original character cards. Lv 07 and Lv 19.' },
  ];

  /* ---------------- character archive ---------------- */
  C.ARCHIVE = {
    title: 'CHARACTER ARCHIVE',
    duck: {
      name: 'DUCKQUACKQUACK', level: '07', alias: 'POGGBOI13000', also: 'aka knives :>', owner: 'Ada\'s character',
      traits: 'Loud, dramatic, chaotic, very confident. Acts before thinking. Believes he is the hero.',
      gear: 'One knife. More up his sleeve.', special: 'Knives Up My Sleeve',
      facts: ['Stole five slippers as a joke, then had to find them all.', 'Was the entire logistics department.', '"I AM PICASSO."'],
      anims: [['idle', 'Idle'], ['walk', 'Waddle'], ['run', 'Panic'], ['jump', 'Jump'], ['swim', 'Swim'], ['damage', 'Dramatic collapse'], ['victory', 'Victory'], ['interact', 'Knives Up My Sleeve']],
    },
    tt: {
      name: 'TURTLETIMEE', level: '20', levelWas: '19', alias: 'SHADERMAXPOWER', also: 'aka emotional damage', owner: 'Qiqi\'s character',
      traits: 'Calm, deadpan, witty, quietly menacing, unbothered, slightly lazy, secretly competitive.',
      gear: 'Sunglasses (held or worn).', special: 'Emotional Damage',
      facts: ['Showers for forty minutes. It\'s called self-care.', 'Streams. Has minions. Eats crackers.', '"I\'ll wait."'],
      anims: [['idle', 'Idle'], ['walk', 'Walk'], ['run', 'Surprisingly fast'], ['jump', 'Jump'], ['swim', 'Swim'], ['damage', 'Unimpressed'], ['victory', 'Tiny smile'], ['interact', 'Emotional Damage']],
    },
    quoteWhere: { 1: 'Hidden in World 1', 2: 'Hidden in World 2', 3: 'Hidden in World 3', 4: 'Hidden at Turtletimee\'s house' },
  };

  C.HOWTO = [
    ['Move', 'A / D  or  ← / →'],
    ['Jump', 'Space  (or W / ↑) — hold for a higher jump'],
    ['Throw knife', 'J  or  left click'],
    ['Panic-sprint', 'Shift'],
    ['Talk / continue', 'Enter, Space, E or click the text box'],
    ['Pause', 'Esc  or  P'],
  ];
  C.HOWTO_NOTE = 'Your progress saves automatically at checkpoints and when you finish a world. Close the tab and come back any time.';

  G.Content = C;
})(window.TT);
