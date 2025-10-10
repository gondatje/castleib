(() => {
  const email = document.getElementById('previewDemoEmail');
  if (email) {
    email.innerHTML = `
      <p style="margin-top:0;">Hi Taylor,</p>
      <p>Below is the working itinerary for the Arcadia weekend. It captures every confirmed touchpoint so you can share an accurate preview with the guests.</p>
      <h3>Friday, May 12</h3>
      <ul>
        <li><strong>2:30&nbsp;PM · Arrival</strong> — Private car service direct to the Manor portico with chilled towels on hand.</li>
        <li><strong>3:00&nbsp;PM · Welcome tea</strong> — Conservatory lounge with jasmine blend, seasonal fruit, and pastry trio.</li>
        <li><strong>5:00&nbsp;PM · Sunset sail</strong> — Dockside crew will greet the party; light bites and rosé stocked on board.</li>
        <li><strong>7:30&nbsp;PM · Chef's table</strong> — Eight-course tasting in the glasshouse. Dietary notes already with the kitchen.</li>
      </ul>
      <h3>Saturday, May 13</h3>
      <p>The day balances exploration with restorative time on property. Massage slots are staggered so everyone rotates through the experiences.</p>
      <ol>
        <li><strong>7:30&nbsp;AM</strong> — Guided shoreline hike with hot cider at the finish.</li>
        <li><strong>9:15&nbsp;AM</strong> — Breakfast in the Orchard Room. Smoothie bar stays open through 11.</li>
        <li><strong>11:00&nbsp;AM</strong> — Choice blocks begin (mixology workshop, falconry intro, or e-bike tour).</li>
        <li><strong>2:00&nbsp;PM</strong> — Picnic and lawn games on the upper terrace.</li>
        <li><strong>6:30&nbsp;PM</strong> — Fireside tasting menu with string trio accompaniment.</li>
        <li><strong>9:00&nbsp;PM</strong> — Nighttime observatory visit with astronomer Riley Snow.</li>
      </ol>
      <h3>Sunday, May 14</h3>
      <p>The departure window remains flexible; late checkout guaranteed. Team will pack luggage while guests enjoy the final tasting.</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="text-align:left;border-bottom:1px solid currentColor;opacity:0.6;">
            <th scope="col" style="padding:6px 0;">Time</th>
            <th scope="col" style="padding:6px 0;">Experience</th>
            <th scope="col" style="padding:6px 0;">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:6px 0;">8:00&nbsp;AM</td>
            <td style="padding:6px 0;">Greenhouse breakfast</td>
            <td style="padding:6px 0;">Chef Lena hosting; cold-pressed juices on rotation.</td>
          </tr>
          <tr>
            <td style="padding:6px 0;">10:30&nbsp;AM</td>
            <td style="padding:6px 0;">Departure prep</td>
            <td style="padding:6px 0;">Bell staff collecting luggage from suites.</td>
          </tr>
          <tr>
            <td style="padding:6px 0;">11:15&nbsp;AM</td>
            <td style="padding:6px 0;">Fond-farewell toast</td>
            <td style="padding:6px 0;">Sparkling elderflower + local chocolates.</td>
          </tr>
          <tr>
            <td style="padding:6px 0;">12:00&nbsp;PM</td>
            <td style="padding:6px 0;">Staggered departures</td>
            <td style="padding:6px 0;">SUV transfers &mdash; drivers will text upon arrival.</td>
          </tr>
        </tbody>
      </table>
      <p>Guest preferences, allergies, and transfer details live in the shared sheet. Let us know if you'd like additional signage or printed cards for the suites.</p>
      <p>Warmly,<br>Amelia</p>
      <p style="margin-bottom:0;font-size:12px;opacity:0.7;">Concierge · Arcadia Manor · 415-555-0128</p>
    `;
  }

  const themeToggle = document.getElementById('previewDemoTheme');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = next;
    });
  }
})();
