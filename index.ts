#!/usr/bin/env node
import inquirer, { Answers } from 'inquirer';

const questions = [
    {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [
            'Echo "Hello world"',
            'Echo "Goodbye"',
            'Enter your name to echo "Hello [name]"',
        ],
    },
    {
        type: 'input',
        name: 'name',
        message: 'What is your name?',
        when: function (answers: Answers) {
            return answers.choice === 'Enter your name to echo "Hello [name]"';
        },
    },
];

inquirer.prompt(questions).then((answers) => {
    switch (answers.choice) {
        case 'Echo "Hello world"':
            console.log('Hello world');
            break;
        case 'Echo "Goodbye"':
            console.log('Goodbye');
            break;
        case 'Enter your name to echo "Hello [name]"':
            console.log(`Hello ${answers.name}`);
            break;
        default:
            console.log('Invalid choice');
            break;
    }
});