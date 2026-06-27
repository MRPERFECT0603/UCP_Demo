import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`UCP Shopping Agent API running on port ${PORT}`);
  console.log(`POST http://localhost:${PORT}/chat`);
});
