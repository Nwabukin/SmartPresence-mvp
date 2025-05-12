const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from SmartPresence Backend!');
});

app.listen(port, () => {
  console.log(`SmartPresence backend listening on port ${port}`);
}); 