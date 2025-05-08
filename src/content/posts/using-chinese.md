---
date: "2025-04-10"
title: "Using Aadish's Chinese practice"
description: "A comprehensive guide to using the Chinese practice application"
# hidden: true
---

_Aadish's Chinese practice_ is a little tool I've created to help me practice my Chinese.

<span class="underline text-red-500">Warning!</span> This help article was AI-generated with minor edits from me (Aadish). If you still have questions, please feel free to reach out to me (contact details at bottom). Also note this is still in development so there _will_ be breaking changes.


## Introduction

Aadish's Chinese Practice is an interactive tool designed to help learners practice Chinese characters and pinyin pronunciation. This application offers two distinct practice modes, comprehensive progress tracking, and an intuitive interface to enhance your Chinese language learning experience. All sentences are from the Integrated Chinese textbook and were scraped using Gemini 2.5 Pro Experimental 03-25. All data is stored in local storage, which means I cannot see any of your data.

## Getting Started

### Selecting Practice Mode

The application offers two primary practice modes:

1. **Chinese Character Writing Practice (Default)** - Practice writing Chinese characters stroke by stroke
2. **Pinyin Practice** - Practice typing the correct pinyin with tone marks for given characters

To switch between modes, use the settings menu by clicking the "settings" button in the bottom left corner of the interface. Your selection will persist across sessions.

### Understanding the Interface

The main interface consists of:

- **Sentence Information** - Shows the current lesson and has a clickable English translation
- **Character Practice Area** - Displays characters to practice writing or typing
- **Navigation Options** - Located at the bottom of the screen

## The Traffic Light System

The traffic light indicators are central to tracking your learning progress:

### How Traffic Lights Work

Each character's status is represented by a colored indicator:

- **Green** - Mastered (completed with minimal assistance)
- **Yellow** - Partially learned (completed with moderate assistance)
- **Red** - Needs review (completed with significant assistance)

### State Transitions

Your traffic light status changes based on two factors:

1. **Number of mistakes made**:

   - **Green to Yellow**: After approximately 5 mistakes in character writing mode or 2 mistakes in pinyin mode
   - **Yellow to Red**: After approximately 7 additional mistakes in character writing mode or 2 additional mistakes in pinyin mode

2. **Level of hints requested**:
   - **Green to Yellow**: Automatically transitions when you request "Show outline" (in character mode) or "Show letters" (in pinyin mode)
   - **Yellow to Red**: Automatically transitions when you request "Show solution" in either mode

Once a character reaches the red status, it indicates you should focus additional practice on this character in future sessions.

## Character Writing Practice

In this mode, you practice writing Chinese characters using proper stroke order.

### How to Practice Writing

1. Observe the character and its pinyin displayed above the writing area
2. Draw the character stroke by stroke in the correct order within the writing box
3. If you make a mistake, the application will alert you and allow you to try again
4. Once successfully completed, the system will animate the character to reinforce learning

### Using Hints

If you need assistance:

1. Click **"Show outline"** to display the character outline as a guide (changes status to yellow)
2. Click **"Show solution"** to see an animation of the proper stroke order (changes status to red)
3. Click **"Replay"** after completion to see the animation again (does not affect status)

## Pinyin Practice

In this mode, you practice typing the correct pinyin with tone marks for given characters.

### How to Type Pinyin

1. View the Chinese character displayed
2. Type the correct pinyin with appropriate tone marks in the input field below
3. Press Enter or click the ⏎ button to submit your answer
4. The system will verify your input and provide feedback

### Using Hints

If you need assistance:

1. Click **"Show letters"** to reveal the pinyin without tone marks (changes status to yellow)
2. Click **"Show solution"** to display the complete pinyin with tone marks (changes status to red)

### Input Methods

You can enter pinyin in two formats:

1. **Standard pinyin** with tone marks (e.g., "nǐ")
2. **Number notation** where the number indicates the tone (e.g., "ni3")

Both input methods are accepted by the system.

## Lesson Selection

You can customize which lessons you want to practice:

### Selecting Lessons

1. Click the **"settings"** button at the bottom of the screen
2. In the Settings modal, you'll see a list of all available lessons
3. Check or uncheck lessons according to your learning needs
4. Click **"Select All"** or **"Deselect All"** to quickly modify your selection
5. When no lessons are selected, all lessons will be used by default

## Progress Tracking

### Viewing History

To view your learning history:

1. Click the **"history"** button at the bottom of the screen
2. A modal will display all characters you've practiced with:
   - Traffic light indicators showing mastery level
   - The relative time since last practice
   - Session identifiers for tracking purposes
3. Toggle between "Characters" and "Pinyin" tabs to view your progress in each mode

### Clearing Data

If you wish to reset your progress:

1. Click the **"history"** button to open the history modal
2. Click **"Clear Data"** at the bottom of the modal
3. Confirm the deletion when prompted

## Navigation and Controls

- **help** - Opens this help documentation
- **history** - Shows your learning progress and history
- **settings** - Opens the settings panel to configure mode and lessons
- **skip/continue** - Proceeds to the next sentence without completing the current one or after completion

## Tips for Effective Learning

1. **Practice regularly** - Short, consistent sessions are more effective than occasional long ones
2. **Alternate between modes** - Switch between character writing and pinyin practice for comprehensive learning
3. **Review your history** - Regularly check your progress to identify characters that need extra attention
4. **Use hints strategically** - Try without hints first to maintain a green status, using more assistance only when necessary
5. **Pay attention to traffic lights** - Focus additional practice on characters that consistently show yellow or red status
6. **Select appropriate lessons** - Focus on specific lessons that align with your current learning goals

## Troubleshooting

- If characters don't display correctly, ensure you're using a modern browser with Chinese font support
- If writing recognition seems too strict, try writing more deliberately and following standard stroke order
- Clear your browser cache if you experience unusual behavior or if the application fails to save your progress
- If the application becomes unresponsive, try refreshing the page (your progress is automatically saved)

---

For additional assistance or to report issues, please contact me (Aadish) at [aadish@ohs.stanford.edu](mailto:aadish@ohs.stanford.edu)

All code is open-source. Find the most stable release [here](https://github.com/aadishv/aadishv.github.io/tree/main/src/components/chinese).
