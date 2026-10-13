// WorkPulse reporting day is consistent for all viewers, including remote users.
export function projectUpdateDay(value) {
 const date=new Date(value);
 if(!value||Number.isNaN(date.getTime()))return '';
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function isProjectUpdateToday(update,now) {
 return !!update?.created_at&&projectUpdateDay(update.created_at)===projectUpdateDay(now);
}
