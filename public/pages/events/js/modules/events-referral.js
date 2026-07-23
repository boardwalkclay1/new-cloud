// public/pages/events/js/modules/events-referral.js

export function setupReferralAndSocial(event) {
  const linkEl = document.getElementById("eventReferralLink");
  const url = `${window.location.origin}/events/event?eventId=${event.id}&ref=cloud`;

  linkEl.textContent = url;

  document.getElementById("copyReferralBtn").onclick = () => {
    navigator.clipboard.writeText(url);
    alert("Referral link copied.");
  };

  document.getElementById("shareTwitterBtn").onclick = () => {
    window.open(`https://twitter.com/intent/tweet?text=${event.title}&url=${url}`);
  };

  document.getElementById("shareFacebookBtn").onclick = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  document.getElementById("shareInstagramBtn").onclick = () => {
    alert("Copy the link and share it on Instagram.");
  };
}
