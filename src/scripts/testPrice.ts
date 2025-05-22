import { calculateDGPUAmount } from "@/utils/calculateRentalPrice";

async function test() {
  const agentId = "gemini-2.0-flash"; 
  const dgpuAmount = await calculateDGPUAmount(agentId);
  console.log(`Agent '${agentId}' hourly rate: ${dgpuAmount.toFixed(4)} dGPU`);
}

test().catch(console.error);
