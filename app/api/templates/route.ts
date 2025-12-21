import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/server/storage'
import { insertTemplateSchema } from '@/shared/schema'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const templates = search ? await storage.searchTemplates(search) : await storage.getAllTemplates()
    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = insertTemplateSchema.parse(body)
    const template = await storage.createTemplate(validated)
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
