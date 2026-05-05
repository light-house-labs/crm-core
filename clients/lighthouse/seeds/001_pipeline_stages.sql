insert into public.pipeline_stages (id, slug, label, color, "order") values
  (1, 'new_inquiry',    'New Inquiry',    '#D3D1C7', 1),
  (2, 'discovery_call', 'Discovery Call', '#9FE1CB', 2),
  (3, 'proposal_sent',  'Proposal Sent',  '#B5D4F4', 3),
  (4, 'negotiation',    'Negotiation',    '#FAC775', 4),
  (5, 'won',            'Won',            '#C0DD97', 5),
  (6, 'lost',           'Lost',           '#F7C1C1', 6)
on conflict (id) do update set label = excluded.label, color = excluded.color;
