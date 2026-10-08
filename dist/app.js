'use strict';
document.documentElement.classList.add('js');
const reveals=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:0,rootMargin:'0px 0px -8% 0px'});reveals.forEach(el=>observer.observe(el))}else reveals.forEach(el=>el.classList.add('visible'));
const motion=document.querySelector('#motion');
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
function setMotion(){document.documentElement.classList.toggle('motion-off',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Enable animation':'Pause animation';document.dispatchEvent(new CustomEvent('motionchange'))}
setMotion();motion.addEventListener('click',()=>{paused=!paused;setMotion()});
const form=document.querySelector('#registration'),status=document.querySelector('#form-status'),submit=form.querySelector('button');
let registrationId=crypto.randomUUID();
if(window.SUMMIT_CONFIG.endpoint)status.textContent='Your details will be sent securely to the summit organizer.';
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;
const endpoint=window.SUMMIT_CONFIG.endpoint;
if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)){status.className='error';status.textContent='Registration is not open yet. Please check back once the organizer activates this form. Your details have not been sent.';return}
const data=Object.fromEntries(new FormData(form));data.consent=data.consent==='on';data.id=registrationId;
submit.disabled=true;submit.textContent='SENDING YOUR RSVP…';status.className='';status.textContent='Submitting your registration…';
try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data),redirect:'follow',signal:AbortSignal.timeout(25000)});const result=await response.json();if(!response.ok||result.status!=='success')throw new Error(result.message||'Unable to confirm registration.');status.className='success';status.textContent='Your RSVP has been recorded. See you at SPMC on October 16, 2026. Reference: '+registrationId;form.reset();registrationId=crypto.randomUUID()}catch(error){status.className='error';status.textContent='We could not confirm your RSVP. Please retry or contact the organizer. Retrying uses the same reference to avoid duplicates.'}finally{submit.disabled=false;submit.innerHTML='SUBMIT MY RSVP <span aria-hidden="true">→</span>'}});
