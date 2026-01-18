#!/usr/bin/env python3
# Add score calculation after Claude returns analysis

file_path = 'index-supabase.js'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "return analysis;" after Claude
insert_at = None
for i, line in enumerate(lines):
    if i > 450 and 'return analysis;' in line and i < 460:
        insert_at = i
        break

if not insert_at:
    print("❌ Could not find insertion point")
    exit(1)

# Code to insert (with 3 tabs indentation)
score_calc_code = """\t\t\t
\t\t\t// CRITIQUE: Claude ne génère PAS les scores - calcul depuis les réponses
\t\t\tif (!analysis.score || typeof analysis.score !== 'object') {
\t\t\t\tconsole.log('📊 Calcul scores depuis questionnaire...');
\t\t\t\tconst scores = { passion: 0, profession: 0, mission: 0, vocation: 0 };
\t\t\t\tconst allAnswers = [];
\t\t\t\tfor (const k in answers) {
\t\t\t\t\tconst v = answers[k];
\t\t\t\t\tif (Array.isArray(v)) allAnswers.push(...v);
\t\t\t\t\telse if (v) allAnswers.push(String(v));
\t\t\t\t}
\t\t\t\tconst m = {'create':{c:'passion',s:25},'analyze':{c:'profession',s:20},'teach':{c:'mission',s:30},'connect':{c:'passion',s:20},'build':{c:'profession',s:25},'explore':{c:'passion',s:20},'tech':{c:'profession',s:20},'art':{c:'passion',s:25},'business':{c:'vocation',s:20},'science':{c:'profession',s:20},'social':{c:'mission',s:30},'health':{c:'mission',s:25},'challenge':{c:'passion',s:20},'impact':{c:'mission',s:30},'learn':{c:'passion',s:20},'team':{c:'profession',s:15},'freedom':{c:'passion',s:25},'dev-perso':{c:'passion',s:15},'creative':{c:'passion',s:25},'culture':{c:'passion',s:15},'advice':{c:'profession',s:20},'organize':{c:'profession',s:20},'mediate':{c:'profession',s:20},'motivate':{c:'mission',s:25},'communication':{c:'profession',s:20},'analysis':{c:'profession',s:25},'creativity':{c:'passion',s:25},'leadership':{c:'profession',s:25},'empathy':{c:'mission',s:25},'execution':{c:'profession',s:20},'practice':{c:'profession',s:20},'read':{c:'profession',s:15},'watch':{c:'profession',s:15},'discuss':{c:'profession',s:15},'leader':{c:'profession',s:25},'analyst':{c:'profession',s:20},'harmonizer':{c:'mission',s:25},'executor':{c:'profession',s:20},'challenger':{c:'passion',s:20},'growth':{c:'passion',s:20},'respect':{c:'mission',s:20},'balance':{c:'vocation',s:15},'startup':{c:'vocation',s:25},'corporate':{c:'vocation',s:15},'remote':{c:'vocation',s:15},'freelance':{c:'vocation',s:25},'wealth':{c:'vocation',s:25},'recognition':{c:'vocation',s:20},'mastery':{c:'profession',s:25},'education':{c:'mission',s:30},'environment':{c:'mission',s:30},'equality':{c:'mission',s:30},'innovation':{c:'vocation',s:25},'community':{c:'mission',s:25},'sustainability':{c:'mission',s:25},'finance':{c:'vocation',s:20}};
\t\t\t\tallAnswers.forEach(a=>{const l=String(a).toLowerCase().trim();if(m[l])scores[m[l].c]=Math.min(100,(scores[m[l].c]||0)+m[l].s);});
\t\t\t\tfor(const k in scores)if(scores[k]===0)scores[k]=60;
\t\t\t\tanalysis.score=scores;
\t\t\t\tconsole.log('✅ Scores calculés:', scores);
\t\t\t}
"""

# Insert the code before return statement
lines.insert(insert_at, score_calc_code)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"✅ Code inserted at line {insert_at + 1}")
print("📝 Added score calculation after Claude returns analysis")
