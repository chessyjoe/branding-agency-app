import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { isActive } = await req.json()
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('api_keys')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

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
