const express = require('express');
const pg = require('pg');
const app = express();
const client = new pg.Client( process.env.DATABASEURL || 'postgres://postgres:molly@localhost:5432/acme_hr_directory');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(require('morgan')('dev'));

app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * FROM employees;`;

        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * FROM departments;`;
        
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

app.post('/api/employees', async (req, res, next) => {
    try {
        const { name, department_id } = req.body;
        const SQL = `
            iNSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *;`;
        const response = await client.query(SQL, [name, department_id]);
        res.send(response.rows[0]);
    } catch (error){
        next(error);
    }
});

app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const { name, department_id } = req.body; 
        const { id } = req.params;
        const SQL = `
            UPDATE employees SET name = $1, department_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURING *;`;
        const response = await client.query(SQL, [name, department_id, id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const SQL = `
            DELETE FROM employees WHERE id = $1;`;
        await client.query(SQL, [id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

//init

const init = async () => {
    try {
        await client.connect();
        const SQL = `
            DROP TABLE IF EXISTS employees;
            DROP TABLE IF EXISTS departments; 
            CREATE TABLE departments (
                id SERIAL PRIMARY KEY, 
                name VARCHAR(50)
            );
                CREATE TABLE employees (
                    id SERIAL PRIMARY KEY, 
                    name VARCHAR(50) NOT NULL, 
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                    department_id INTEGER REFERENCES departments(id)
                );
                INSERT INTO departments(name) VALUES('HR'), ('Programming'), ('Business');
                INSERT INTO employees(name, department_id) VALUES('John Doe', 1), ('Jane Doe', 2), ('Bob Bobbart', 3);
        `;
        await client.query(SQL);
            console.log('tables created, data seeded');
        app.listen(PORT, () => console.log(`Server listening on PORT ${PORT}`));
    } catch (error) {
        console.error('ERROR', error);
    }
};

init();