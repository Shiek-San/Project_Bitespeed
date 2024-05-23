import "reflect-metadata";
import express from 'express';
import connectDB from './database';
import contactRouter from './routes/contactRoutes';
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

connectDB().then(() => {

    app.use('/api', contactRouter);

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error("Database connection failed:", error);
    process.exit(1);
});
