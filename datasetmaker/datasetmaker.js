const fs = require('fs');
const path = require('path');

// Define the path to your UTAU voicebank folder and the file list
const voicebankFolder = 'voicebank/vb';
const fileListPath = 'reclist/reclist.txt';
const outputFolder = 'Output';
const numberOfCycles = 1; // Adjust this number as needed

console.log(`Voicebank folder: ${voicebankFolder}`);
console.log(`File list path: ${fileListPath}`);
console.log(`Output folder: ${outputFolder}`);
console.log(`Number of cycles: ${numberOfCycles}`);

// Use path.resolve() to construct file paths
const voicebankFolderPath = path.resolve(__dirname, voicebankFolder);
const fileListFullPath = path.resolve(__dirname, fileListPath);
const outputFolderPath = path.resolve(__dirname, outputFolder);

// Read the file list and append '.wav' extension to filenames
const fileContents = fs.readFileSync(fileListFullPath, 'utf-8');
const fileArray = fileContents
  .split('\n')
  .map(file => `${file.trim()}.wav`); // Append '.wav'

console.log(`Read ${fileArray.length} files from the file list.`);

// Get a list of subdirectories (pitch folders)
const pitchFolders = fs.readdirSync(voicebankFolderPath)
  .filter(item => fs.statSync(path.join(voicebankFolderPath, item)).isDirectory());

console.log(`Found ${pitchFolders.length} pitch folders.`);

// Create the output folder if it doesn't exist
if (!fs.existsSync(outputFolderPath)) {
  fs.mkdirSync(outputFolderPath);
  console.log(`Created output folder: ${outputFolderPath}`);
}

// Initialize counters for each pitch folder
const pitchCounters = {};
pitchFolders.forEach(folder => {
  pitchCounters[folder] = 0;
});

// Function to copy a file from source to destination
function copyFile(source, destination) {
  try {
    // Check if the destination file already exists
    let dest = destination;
    let counter = 1;
    while (fs.existsSync(dest)) {
      const extIndex = destination.lastIndexOf('.'); // Get the last dot
      const basename = destination.slice(0, extIndex); // File name without extension
      const ext = destination.slice(extIndex); // File extension
      dest = `${basename} (${counter})${ext}`; // Append (1), (2), etc.
      counter++;
    }
    
    fs.copyFileSync(source, dest);
    console.log(`Copied file: ${path.basename(source)} - ${path.dirname(source)} to ${path.basename(dest)} - ${path.dirname(dest)}`);
  } catch (error) {
    console.error(`Error copying file: ${path.basename(source)} - ${path.dirname(source)}`);
  }
}

// Cycle through pitch folders and copy files in a round-robin fashion
for (let cycle = 0; cycle < numberOfCycles; cycle++) {
  for (let i = 0; i < fileArray.length; i++) {
    const pitchFolder = pitchFolders[i % pitchFolders.length];
    const sourceFile = path.resolve(voicebankFolderPath, pitchFolder, fileArray[i]);
    const destinationFile = path.resolve(outputFolderPath, fileArray[i]);

    // Check if the pitch folder has reached its limit
    if (pitchCounters[pitchFolder] < Math.ceil(fileArray.length / pitchFolders.length)) {
      if (fs.existsSync(sourceFile)) {
        copyFile(sourceFile, destinationFile);
        pitchCounters[pitchFolder]++;
      } else {
        console.warn(`File not found: ${fileArray[i]} - ${pitchFolder}`);
      }
    }
  }
}

console.log('Files copied to the output folder.');
