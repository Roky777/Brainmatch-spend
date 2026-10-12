const star='<path d="m50 9 12 25 28 4-21 20 5 29-24-14-25 14 5-29L9 38l29-4Z" fill="#ffe36b"/><g fill="#34324d" stroke="none"><ellipse cx="40" cy="49" rx="3" ry="4"/><ellipse cx="60" cy="49" rx="3" ry="4"/></g><path d="M45 58q5 6 10 0" fill="none" stroke="#34324d" stroke-width="2.5" stroke-linecap="round"/><g fill="#ec8393" opacity=".55" stroke="none"><ellipse cx="32" cy="56" rx="5" ry="3"/><ellipse cx="68" cy="56" rx="5" ry="3"/></g>';

export function icon(id,cls=''){
  const art=id==='star'?star:star;
  return `<svg class="icon ${cls}" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#5c5264" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${art}</svg>`;
}
