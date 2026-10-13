export const PROJECT_COLUMNS = [
 ['ticket_no','Ticket no.'],['custom_name','Custom name'],['client_name','Client name'],['client_tier','Client tier'],['applied_to','Applied to?'],['system','System'],['priority','Priority'],['assigned_to','Assigned to?'],['assigned_dev','Assigned Dev'],['assigned_qa','Assigned QA'],['status','Status'],['is_signed','Is Signed?'],['deployment_date','Deployment Date'],['pending_to','Pending To?'],['remarks','Remarks'],
];
export const PROJECT_ROW_FIELDS = PROJECT_COLUMNS.filter(([key]) => !['client_name','client_tier'].includes(key));
export const PROJECT_SYSTEMS = ['JPS','ESS','BUNDY','WEBHR','PPH','INSIGHT'];
export const PROJECT_TIERS = ['Standard','VIP','VVIP','VVVIP'];
export const PROJECT_PRIORITIES = ['Critical','High','Medium','Low'];
export const PROJECT_STATUSES = ['Ongoing','Active','In Progress','For QA','Completed','On Hold','Deployed','For Review'];
export const emptyProjectRow = () => ({ ticket_no:'', custom_name:'', client_name:'', client_tier:'Standard', applied_to:'', system:'JPS', priority:'Medium', assigned_to:'', assigned_dev:'', assigned_qa:'', status:'Ongoing', is_signed:false, deployment_date:'', pending_to:'', remarks:'' });
// RFC-style quoted fields: commas, escaped quotes and multiline remarks.
export function parseProjectCSV(text, profiles, project = {}, options = {}) {
 const records=[]; let record=[], field='', quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++) {
  const char=text[i];
  if(char==='"') { if(quoted && text[i+1]==='"'){field+='"';i++;} else if(!quoted && field!=='') throw new Error('Unexpected quote in CSV field.'); else quoted=!quoted; }
  else if(char===',' && !quoted){record.push(field);field='';}
  else if((char==='\n'||char==='\r') && !quoted){if(char==='\r'&&text[i+1]==='\n')i++;record.push(field);if(record.some(value=>value.trim()))records.push(record);record=[];field='';}
  else field+=char;
 }
 if(quoted)throw new Error('Unclosed quoted CSV field.');
 record.push(field);if(record.some(value=>value.trim()))records.push(record);
 if(records.length<2)throw new Error('CSV needs a header and at least one data row.');
 const normalize=value=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
 const headers=records.shift().map(normalize);
 if(new Set(headers).size!==headers.length)throw new Error('Duplicate CSV headers.');
 const indices=PROJECT_ROW_FIELDS.map(([key,label])=>{const index=headers.findIndex(header=>header===normalize(key)||header===normalize(label));if(index<0 && key!=='priority')throw new Error(`Missing column: ${label}`);return index;});
 if(records.length>200)throw new Error('Import a maximum of 200 rows per file.');
 const tickets=new Set();
 return records.map((values,index)=>{
  if(values.length!==headers.length)throw new Error(`Row ${index+2}: column count does not match the header.`);
  const row=Object.fromEntries(PROJECT_ROW_FIELDS.map(([key],column)=>[key,(values[indices[column]]||'').trim()]));
  row.priority=row.priority||'Medium';
  row.client_name=project.client_name||project.name||'';row.client_tier=project.tier||'Standard';
  if(!row.ticket_no || !row.custom_name)throw new Error(`Row ${index+2}: Ticket no. and Custom name are required.`);
  const ticket=row.ticket_no.toLowerCase();if(tickets.has(ticket))throw new Error(`Row ${index+2}: duplicate Ticket no. ${row.ticket_no}`);tickets.add(ticket);
  for(const [key,options] of [['priority',PROJECT_PRIORITIES],['status',PROJECT_STATUSES]]){
   const match=options.find(option=>option.toLowerCase()===row[key].toLowerCase());if(!match)throw new Error(`Row ${index+2}: invalid ${key}.`);row[key]=match;
  }
  const systems=row.system.split(',').map(value=>value.trim().toUpperCase()).filter(Boolean);
  if(!systems.length||systems.some(value=>!PROJECT_SYSTEMS.includes(value)))throw new Error(`Row ${index+2}: invalid system. Use JPS, ESS, BUNDY, WEBHR, PPH or INSIGHT (comma-separated).`);
  row.system=[...new Set(systems)].join(', ');
  if(!['yes','no','true','false','1','0'].includes(row.is_signed.toLowerCase()))throw new Error(`Row ${index+2}: Is Signed? must be Yes or No.`);
  row.is_signed=['yes','true','1'].includes(row.is_signed.toLowerCase());
  if(row.deployment_date==='-')row.deployment_date='';
  const usDate=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(row.deployment_date);
  if(usDate)row.deployment_date=`${usDate[3]}-${usDate[1].padStart(2,'0')}-${usDate[2].padStart(2,'0')}`;
  if(row.deployment_date && (!/^\d{4}-\d{2}-\d{2}$/.test(row.deployment_date)||Number.isNaN(Date.parse(row.deployment_date))||new Date(row.deployment_date).toISOString().slice(0,10)!==row.deployment_date))throw new Error(`Row ${index+2}: use a valid YYYY-MM-DD deployment date.`);
  for(const key of ['assigned_to']){
   if(!row[key]||row[key]==='-'){row[key]=null;continue;}
   const matches=profiles.filter(profile=>profile.is_active && (profile.id===row[key]||profile.username?.toLowerCase()===row[key].replace(/^@/,'').toLowerCase()||profile.name?.trim().toLowerCase()===row[key].toLowerCase()));
   if(matches.length!==1){if(options.allowUnresolved){row._assigned_to_label=row[key];row[key]=null;continue;}throw new Error(`Row ${index+2}: ${key} must match one active user; use a username or UUID.`);}row[key]=matches[0].id;
  }
  for(const key of ['ticket_no','custom_name','applied_to','pending_to','assigned_dev','assigned_qa'])if(row[key].length>120)throw new Error(`Row ${index+2}: ${key} exceeds 120 characters.`);
  if(row.remarks.length>2000)throw new Error(`Row ${index+2}: remarks exceed 2000 characters.`);
  return row;
 });
}
