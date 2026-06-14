import { supabase } from './supabase';

export const logAdminActivity = async (actionType, description, details = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('activity_logs').insert([{
      admin_id: user.id,
      admin_email: user.email,
      action_type: actionType,
      description: description,
      details: details
    }]);
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
};
