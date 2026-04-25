const express = require('express')
const cors = require('cors');
const app = express()
app.use(cors());
app.use(express.json());
const port = 5002

const mobilRoutes = require('./routes/mobilRoutes');

app.use('/mobil', mobilRoutes);
app.get('/', (req, res) => {
  res.send('Hello World! This is the backend server for the Showroom Management System.')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
