#!/usr/bin/env node
import inquirer, { Answers } from 'inquirer';
import { execSync } from 'child_process';
import { exit } from 'process';
import * as fs from 'fs';

const drizzleOrm = "drizzle-orm";
const drizzleKit = "drizzle-kit"
const defaultName = "my-app";

enum Pm {
    npm = "npm",
    yarn = "yarn",
    pnpm = "pnpm"
}

enum Database {
    Sqlite = "Sqlite - Driver: better-sqlite3",
    MySql = "MySql - Driver: mysql2",
    Postgres = "Postgres - Driver: pg"
}

enum MetaFramework {
    Nuxt = "nuxt",
    Next = "next"
}

const databaseChoice = [
    {
        type: 'list',
        name: 'choice',
        message: 'Choose your preferred database engine:',
        choices: [
            ...Object.values(Database)
        ],
    }
];

const sqliteConfigChoice = [
    {
        type: 'input',
        name: 'database',
        message: 'Enter your Sqlite database name:',
        default: defaultName,
        when: true
    },
];

const configChoice = (db: string) => [
    {
        type: 'input',
        name: 'host',
        message: `Enter your ${db} host:`,
        default: 'localhost',
        when: true
    },
    {
        type: 'input',
        name: 'port',
        message: `Enter your ${db} port:`,
        default: db === 'mysql' ? '3306' : '5432',
        when: true
    },
    {
        type: 'input',
        name: 'user',
        message: `Enter your ${db} user:`,
        default: db === 'mysql' ? 'root' : 'postgres',
        when: true
    },
    {
        type: 'password',
        name: 'password',
        message: `Enter your ${db} password:`,
        default: '',
        when: true
    },
    {
        type: 'input',
        name: 'database',
        message: `Enter your ${db} database:`,
        default: defaultName,
        when: true
    },
    {
        type: 'list',
        name: 'pool',
        message: `Do you want to use a connection pool for ${db}?`,
        choices: [
            'Yes',
            'No'
        ],
        when: true
    },
    {
        type: 'input',
        name: 'poolMin',
        message: `Enter your ${db} pool min:`,
        default: '1',
        when: (answers: Answers) => answers.pool === 'Yes'
    },
    {
        type: 'input',
        name: 'poolMax',
        message: `Enter your ${db} pool max:`,
        default: '5',
        when: (answers: Answers) => answers.pool === 'Yes'
    },
];

const metaFrameworkChoice = [
    {
        type: 'list',
        name: 'choice',
        message: 'Choose your preferred meta-framework:',
        choices: [
            ...Object.values(MetaFramework)
        ],
    },
    {
        type: 'input',
        name: 'name',
        message: 'Enter your project name:',
        default: defaultName,
        when: true
    }
];

let pm = process.env.npm_execpath
let database: Database;
let projectName: string;


if (pm?.includes('yarn') || pm?.includes('pnpm')) {
    pm = pm.split('\\').pop()?.split('.').shift() as string;
    pm = pm === 'yarn' ? Pm.yarn : Pm.pnpm;
} else {
    pm = Pm.npm;
}
console.log(`\x1b[33m${pm}\x1b[0m will be used to install dependencies and run the project.`);

inquirer
    .prompt(databaseChoice)
    .then((answers: Answers) => {
        switch (answers.choice) {
            case Database.Sqlite:
                database = Database.Sqlite;
                break;
            case Database.MySql:
                database = Database.MySql;
                break;
            case Database.Postgres:
                database = Database.Postgres;
                break;
            default:
                console.log('No database selected. | This is an error Exiting...');
                exit(1);
        }

        console.log(`\x1b[30m > ${database}\x1b[0m will be used as the database engine.`);

        inquirer
            .prompt(metaFrameworkChoice)
            .then((metaFramework: Answers) => {
                projectName = metaFramework.name.toLowerCase().replace(' ', '-');

                switch (metaFramework.choice) {
                    case MetaFramework.Nuxt:
                        console.log(`\x1b[32m > ${MetaFramework.Nuxt}\x1b[0m chosen.`);
                        console.log(`\x1b[30m > ${projectName}\x1b[0m will be the project name.`);
                        try {
                            execSync(`npx nuxi@latest init ${projectName}`, { stdio: 'inherit' });
                        } catch (error: any) {
                            console.error(error?.message);
                        }
                        break;
                    case MetaFramework.Next:
                        console.log(`\x1b[32m${MetaFramework.Next}\x1b[0m chosen.`);
                        try {
                            execSync(`npx create-next-app@latest ${projectName}`, { stdio: 'inherit' });
                        } catch (error: any) {
                            console.error(error?.message);
                        }
                        break;
                    default:
                        console.log('No meta-framework selected. | This is an error Exiting...');
                        exit(1);
                }

                // install the database driver and dependencies
                const databaseDriver = database.split(' - Driver: ').pop() as string;
                const command = `cd ${projectName} && ${pm} ${pm === Pm.npm ? 'install' : 'add'} ${databaseDriver} ${drizzleOrm} ${drizzleKit} && ${pm} install`;

                execSync(command, { stdio: 'inherit' });

                function createConfigFile() {
                    fs.writeFileSync(`${projectName}/db.ts`, configFile);

                    // check if vscode is installed
                    try {
                        execSync('code --version', { stdio: 'ignore' });
                    } catch (error) {
                        console.log('Vscode is not installed. Exiting...');
                        exit(0);
                    }

                    // open the project in vscode
                    execSync(`code ${projectName}`, { stdio: 'inherit' });

                    // print how to import the db with color
                    console.log(`Here's how to import the db in your project:\n`);
                    console.log(`\x1b[32mimport db from './db';\x1b[0m\n`);
                }

                // create the database config file
                let configFile: string = '';
                switch (database) {
                    case Database.Sqlite:
                        inquirer
                            .prompt(sqliteConfigChoice)
                            .then((sqliteConfig: Answers) => {
                                configFile =  `import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
                                import Database from 'better-sqlite3';
                                 
                                const sqlite = new Database('${sqliteConfig.name}');
                                const db: BetterSQLite3Database = drizzle(sqlite);
                                export default db;`;
                                createConfigFile();
                            });
                        break;
                    case Database.MySql:
                        inquirer
                            .prompt(configChoice("mysql"))
                            .then((config: Answers) => {
                                configFile = `import { drizzle } from "drizzle-orm/mysql2";
                                import mysql from "mysql2/promise";
                                
                                const poolConnection = mysql.createPool({
                                    host: '${config.host}',
                                    user: '${config.user}',
                                    password: '${config.password}',
                                    database: '${config.database}',
                                    waitForConnections: true,
                                    connectionLimit: ${ config.poolMax },
                                    queueLimit: ${ config.poolMin }
                                });
                                
                                const db = drizzle(poolConnection);
                                export default db; `;
                                createConfigFile();
                            });
                        break;
                    case Database.Postgres:
                        console.log('Postgres config not implemented yet.');
                        break;
                    default:
                        console.log('No database selected. | This is an error Exiting...');
                        exit(1);
                }
            });
    });