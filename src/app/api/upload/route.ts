import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const jobFile = formData.get('jobFile') as File | null;
    const cvFile = formData.get('cvFile') as File | null;

    // 1. Validation de présence
    if (!jobFile || !cvFile) {
      return NextResponse.json(
        { success: false, error: "La Fiche de Poste et le CV sont obligatoires." },
        { status: 400 }
      );
    }

    // 2. Validation du format PDF
    if (jobFile.type !== 'application/pdf' || cvFile.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: "Seul le format PDF est autorisé." },
        { status: 400 }
      );
    }

    // 3. Conversion en Buffer pour traitement futur
    const jobBuffer = Buffer.from(await jobFile.arrayBuffer());
    const cvBuffer = Buffer.from(await cvFile.arrayBuffer());

    return NextResponse.json({
      success: true,
      message: "Fichiers PDF reçus et validés avec succès.",
      jobSize: jobBuffer.length,
      cvSize: cvBuffer.length
    });

  } catch (error) {
    console.error("Erreur Upload API:", error);
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue lors de la réception des fichiers." },
      { status: 500 }
    );
  }
}
