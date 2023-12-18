require('dotenv').config();
const express = require('express');
const app = express();
const errorHandler = require('./middlewares/common/error_handler');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const userRouter = require('./router/user_router')(express);
const adminRouter = require('./router/admin_router')(express);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
    dbName: process.env.DBNAME, 
    user: process.env.DBUSERNAME,
    pass: process.env.DBPASSWORD,
    authSource: process.env.DBAUTHSOURCE,
  };

mongoose.connect(process.env.DATABASE_URL, dbOptions)
  .then(() => console.log("connection successfull"))
  .catch(err => console.log(err));

app.use('/v1/user', userRouter);
app.use('/v1/admin', adminRouter);


app.use((req, res, next) => {
    res.status(404).json({
        message: '404 Not found'
    })
})

app.use(errorHandler);

app.listen(process.env.PORT, ()=>{
    console.log(`APP is running at port: ${process.env.PORT}`);
});