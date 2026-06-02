import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const SAMPLE_FILES: Record<string, { filename: string; contentType: string }> = {
  analytics: {
    filename: 'API Logs Data_API_Statistics.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  prediction: {
    filename: 'API Monitoring Data_Prediction_Model.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string }> }
) {
  const { kind } = await params
  const sample = SAMPLE_FILES[kind]

  if (!sample) {
    return NextResponse.json({ message: 'Sample data is not available for this feature.' }, { status: 404 })
  }

  try {
    const filePath = path.join(process.cwd(), 'Sample Data', sample.filename)
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': sample.contentType,
        'Content-Disposition': `attachment; filename="${sample.filename}"`,
        'X-Sample-Filename': sample.filename,
      },
    })
  } catch {
    return NextResponse.json({ message: 'Sample data file could not be loaded.' }, { status: 500 })
  }
}
