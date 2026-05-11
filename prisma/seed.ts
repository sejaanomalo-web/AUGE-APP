import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  { name: "Supino reto com barra", muscleGroup: "Peito" },
  { name: "Supino inclinado com halteres", muscleGroup: "Peito" },
  { name: "Supino declinado", muscleGroup: "Peito" },
  { name: "Crucifixo com halteres", muscleGroup: "Peito" },
  { name: "Crossover na polia", muscleGroup: "Peito" },
  { name: "Flexão de braço", muscleGroup: "Peito" },
  { name: "Peck deck", muscleGroup: "Peito" },
  { name: "Pullover", muscleGroup: "Peito" },
  { name: "Puxada frente na polia", muscleGroup: "Costas" },
  { name: "Puxada atrás na polia", muscleGroup: "Costas" },
  { name: "Remada curvada com barra", muscleGroup: "Costas" },
  { name: "Remada cavalinho", muscleGroup: "Costas" },
  { name: "Remada baixa na polia", muscleGroup: "Costas" },
  { name: "Pulldown", muscleGroup: "Costas" },
  { name: "Levantamento terra", muscleGroup: "Costas" },
  { name: "Barra fixa", muscleGroup: "Costas" },
  { name: "Agachamento livre", muscleGroup: "Pernas" },
  { name: "Leg press 45°", muscleGroup: "Pernas" },
  { name: "Cadeira extensora", muscleGroup: "Pernas" },
  { name: "Mesa flexora", muscleGroup: "Pernas" },
  { name: "Stiff", muscleGroup: "Pernas" },
  { name: "Avanço com halteres", muscleGroup: "Pernas" },
  { name: "Hack squat", muscleGroup: "Pernas" },
  { name: "Panturrilha em pé", muscleGroup: "Pernas" },
  { name: "Panturrilha sentado", muscleGroup: "Pernas" },
  { name: "Desenvolvimento militar com barra", muscleGroup: "Ombros" },
  { name: "Desenvolvimento com halteres", muscleGroup: "Ombros" },
  { name: "Elevação lateral", muscleGroup: "Ombros" },
  { name: "Elevação frontal", muscleGroup: "Ombros" },
  { name: "Elevação posterior", muscleGroup: "Ombros" },
  { name: "Encolhimento (trapézio)", muscleGroup: "Ombros" },
  { name: "Arnold press", muscleGroup: "Ombros" },
  { name: "Rosca direta com barra", muscleGroup: "Bíceps" },
  { name: "Rosca alternada com halteres", muscleGroup: "Bíceps" },
  { name: "Rosca martelo", muscleGroup: "Bíceps" },
  { name: "Rosca scott", muscleGroup: "Bíceps" },
  { name: "Rosca 21", muscleGroup: "Bíceps" },
  { name: "Rosca concentrada", muscleGroup: "Bíceps" },
  { name: "Tríceps na polia", muscleGroup: "Tríceps" },
  { name: "Tríceps testa com halter", muscleGroup: "Tríceps" },
  { name: "Tríceps francês", muscleGroup: "Tríceps" },
  { name: "Tríceps coice", muscleGroup: "Tríceps" },
  { name: "Mergulho em paralelas", muscleGroup: "Tríceps" },
  { name: "Tríceps corda", muscleGroup: "Tríceps" },
  { name: "Abdominal supra", muscleGroup: "Abdômen" },
  { name: "Abdominal infra", muscleGroup: "Abdômen" },
  { name: "Prancha frontal", muscleGroup: "Abdômen" },
  { name: "Russian twist", muscleGroup: "Abdômen" },
  { name: "Bicicleta no solo", muscleGroup: "Abdômen" },
  { name: "Abdominal canivete", muscleGroup: "Abdômen" },
  { name: "Esteira", muscleGroup: "Cardio" },
  { name: "Bicicleta ergométrica", muscleGroup: "Cardio" },
  { name: "Elíptico", muscleGroup: "Cardio" },
  { name: "Corrida ao ar livre", muscleGroup: "Cardio" },
  { name: "HIIT", muscleGroup: "Cardio" },
  { name: "Burpee", muscleGroup: "Cardio" },
];

async function main() {
  console.log("🌱 Seeding exercises...");
  for (const ex of exercises) {
    const id = `seed-${ex.muscleGroup}-${ex.name}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
    await prisma.exercise.upsert({
      where: { id },
      update: {},
      create: { id, name: ex.name, muscleGroup: ex.muscleGroup, isCustom: false },
    });
  }
  console.log(`✅ ${exercises.length} exercícios criados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
