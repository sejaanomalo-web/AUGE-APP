import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedExercise = {
  name: string;
  muscleGroup: string;
  category: "ACADEMIA" | "CORRIDA";
};

const exercises: SeedExercise[] = [
  { name: "Supino reto com barra", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Supino inclinado com halteres", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Supino declinado", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Crucifixo com halteres", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Crossover na polia", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Flexão de braço", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Peck deck", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Pullover", muscleGroup: "Peito", category: "ACADEMIA" },
  { name: "Puxada frente na polia", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Puxada atrás na polia", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Remada curvada com barra", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Remada cavalinho", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Remada baixa na polia", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Pulldown", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Levantamento terra", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Barra fixa", muscleGroup: "Costas", category: "ACADEMIA" },
  { name: "Agachamento livre", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Leg press 45°", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Cadeira extensora", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Mesa flexora", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Stiff", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Avanço com halteres", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Hack squat", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Panturrilha em pé", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Panturrilha sentado", muscleGroup: "Pernas", category: "ACADEMIA" },
  { name: "Desenvolvimento militar com barra", muscleGroup: "Ombros", category: "ACADEMIA" },
  { name: "Desenvolvimento com halteres", muscleGroup: "Ombros", category: "ACADEMIA" },
  { name: "Elevação lateral", muscleGroup: "Ombros", category: "ACADEMIA" },
  { name: "Elevação frontal", muscleGroup: "Ombros", category: "ACADEMIA" },
  { name: "Elevação posterior", muscleGroup: "Ombros", category: "ACADEMIA" },
  { name: "Encolhimento (trapézio)", muscleGroup: "Ombros", category: "ACADEMIA" },
  { name: "Arnold press", muscleGroup: "Ombros", category: "ACADEMIA" },
  { name: "Rosca direta com barra", muscleGroup: "Bíceps", category: "ACADEMIA" },
  { name: "Rosca alternada com halteres", muscleGroup: "Bíceps", category: "ACADEMIA" },
  { name: "Rosca martelo", muscleGroup: "Bíceps", category: "ACADEMIA" },
  { name: "Rosca scott", muscleGroup: "Bíceps", category: "ACADEMIA" },
  { name: "Rosca 21", muscleGroup: "Bíceps", category: "ACADEMIA" },
  { name: "Rosca concentrada", muscleGroup: "Bíceps", category: "ACADEMIA" },
  { name: "Tríceps na polia", muscleGroup: "Tríceps", category: "ACADEMIA" },
  { name: "Tríceps testa com halter", muscleGroup: "Tríceps", category: "ACADEMIA" },
  { name: "Tríceps francês", muscleGroup: "Tríceps", category: "ACADEMIA" },
  { name: "Tríceps coice", muscleGroup: "Tríceps", category: "ACADEMIA" },
  { name: "Mergulho em paralelas", muscleGroup: "Tríceps", category: "ACADEMIA" },
  { name: "Tríceps corda", muscleGroup: "Tríceps", category: "ACADEMIA" },
  { name: "Abdominal supra", muscleGroup: "Abdômen", category: "ACADEMIA" },
  { name: "Abdominal infra", muscleGroup: "Abdômen", category: "ACADEMIA" },
  { name: "Prancha frontal", muscleGroup: "Abdômen", category: "ACADEMIA" },
  { name: "Russian twist", muscleGroup: "Abdômen", category: "ACADEMIA" },
  { name: "Bicicleta no solo", muscleGroup: "Abdômen", category: "ACADEMIA" },
  { name: "Abdominal canivete", muscleGroup: "Abdômen", category: "ACADEMIA" },
  { name: "Esteira", muscleGroup: "Cardio", category: "CORRIDA" },
  { name: "Bicicleta ergométrica", muscleGroup: "Cardio", category: "ACADEMIA" },
  { name: "Elíptico", muscleGroup: "Cardio", category: "ACADEMIA" },
  { name: "Corrida ao ar livre", muscleGroup: "Cardio", category: "CORRIDA" },
  { name: "HIIT", muscleGroup: "Cardio", category: "ACADEMIA" },
  { name: "Burpee", muscleGroup: "Cardio", category: "ACADEMIA" },
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
      // Atualiza category em seeds já existentes para refletir Academia/Corrida.
      update: { category: ex.category },
      create: {
        id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        category: ex.category,
        isCustom: false,
      },
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
