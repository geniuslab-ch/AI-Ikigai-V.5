/**
 * Questionnaire API - Handles submission to Supabase
 * This file should be loaded AFTER supabase-client.js
 */

const QuestionnaireAPI = {
    /**
     * Submit questionnaire answers to Supabase
     * @param {Object} answers - User's answers to questions
     * @param {string} userEmail - User's email (optional fallback)
     * @returns {Promise} Submission result with analysis data
     */
    async submit(answers, userEmail = null) {
        try {
            console.log('📝 Submitting questionnaire...');

            // Get current authenticated user
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                console.error('❌ User not authenticated');
                throw new Error('Vous devez être connecté pour soumettre le questionnaire');
            }

            console.log('✅ User authenticated:', user.email);

            // Get user's profile to check for coach relationship
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('id, email, name')
                .eq('id', user.id)
                .single();

            // Check if user was invited by a coach
            let coachId = null;
            const { data: coachRelation } = await supabaseClient
                .from('coach_clients')
                .select('coach_id')
                .eq('client_id', user.id)
                .single();

            if (coachRelation) {
                coachId = coachRelation.coach_id;
                console.log('👨‍🏫 User has coach:', coachId);
            }

            // Prepare analysis data
            const analysisData = {
                user_id: user.id,
                coach_id: coachId,
                user_email: user.email,
                answers: answers,
                status: 'completed',
                created_at: new Date().toISOString()
            };

            // Insert into analyses table
            const { data: analysis, error: insertError } = await supabaseClient
                .from('analyses')
                .insert(analysisData)
                .select()
                .single();

            if (insertError) {
                console.error('❌ Error inserting analysis:', insertError);
                throw insertError;
            }

            console.log('✅ Analysis saved:', analysis.id);

            return {
                success: true,
                analysisId: analysis.id,
                questionnaireId: analysis.id, // For backward compatibility
                analysis: analysis
            };

        } catch (error) {
            console.error('❌ Questionnaire submission error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Upload CV file to Supabase Storage
     * @param {File} file - CV file to upload
     * @returns {Promise} Upload result
     */
    async uploadCV(file) {
        try {
            console.log('📄 Uploading CV...');

            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabaseClient.storage
                .from('cvs')
                .upload(fileName, file);

            if (error) throw error;

            console.log('✅ CV uploaded:', data.path);

            // Update user profile with CV path
            await supabaseClient
                .from('profiles')
                .update({ cv_path: data.path })
                .eq('id', user.id);

            return {
                success: true,
                cvPath: data.path,
                cvData: { path: data.path }
            };

        } catch (error) {
            console.error('❌ CV upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Make available globally
window.QuestionnaireAPI = QuestionnaireAPI;

console.log('✅ QuestionnaireAPI loaded');
