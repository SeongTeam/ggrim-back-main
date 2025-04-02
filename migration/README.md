# OverView
- this folder is for migration task of typeORM
- you can update DB schema and apply new changes to an existing DB
- ref : https://orkhan.gitbook.io/typeorm/docs/migrations



# How to Start

## Setup

1) setup environment 
    - install typeORM CLI and dependent packages
    - ref : https://orkhan.gitbook.io/typeorm/docs/using-cli#installing-cli
2) setup {root_dir}/migration.option.ts file
    - this file represents target DB and typeORM configuration


## Create Migration file

1) run script command 
```
$npm run typeorm:create-migration --name={file_name}
```

2) open created file 
- this file is located at ./migration/action

3) write up() and down() method
- ref : https://orkhan.gitbook.io/typeorm/docs/migrations#creating-a-new-migration


## Generate Migration file

1) modify entity file on src

2) run script command
```
$node migration_action.js generate {file name}
```
- this command generate migration file to update DB based on your newly modified codebase
- ref : 

3) check generated file 
- this file is located at ./migration/action

## Run Migration File

1) Create or Generate Migration file

2) run script command
```
$node migration_action.js run 
```

3) check DB 
- you can check result of changes on DB
- you can also check {root_dir}/ormlogs.log file 
    - query log is dependent on {root_dir}/migration.option.ts logger and log options

## Revert Migration File

1) Create or Generate Migration file

2) run script command
This command will undo only the last executed migration. You can execute this command multiple times to revert multiple migrations
```
$node migration_action.js revert
```



# FAQ

## Command run Error
- if you face error, you need to modify script command in package.json
    - this command run js code with cross-env for cross-platform 
    - but, it is maybe not cross-platform (I didn't test all platform) 