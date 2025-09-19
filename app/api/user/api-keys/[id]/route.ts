import { createServerClient } from "@/lib/supabase"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { isActive } = await req.json()
    const supabase = createServerClient()
    const userId = 'demo-user' // In real app, get from auth

    const { data, error } = await supabase
      .from('api_keys')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return Response.json({ 
      success: true, 
      apiKey: data
    })
  } catch (error) {
    console.error('Error updating API key:', error)
    return Response.json({ 
      success: false, 
      error: "Failed to update API key" 
    }, { 
      status: 500 
    })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const userId = 'demo-user' // In real app, get from auth

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) throw error

    return Response.json({ 
      success: true
    })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return Response.json({ 
      success: false, 
      error: "Failed to delete API key" 
    }, { 
      status: 500 
    })
  }
}
