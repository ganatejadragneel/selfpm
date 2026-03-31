# SelfPM Raw Data Summary
## Export Date: December 1, 2025

---

## Data Structure Overview

The SelfPM data export contains three main sections:
1. **User Information**
2. **Custom Tasks (Metric Definitions)**
3. **Completions (Daily Entries)**
4. **Notes (Qualitative Annotations)**

---

## 1. User Information

```json
{
  "id": "41a94776-0ab1-4ae3-a752-2cb1c6ae0d27",
  "email": "gkaushik98@gmail.com"
}
```

---

## 2. Custom Tasks Summary

**Total Metrics Defined**: 19

| # | Metric Name | Type | Created Date |
|---|-------------|------|--------------|
| 1 | Jabam (M) | yes_no | 2025-09-02 |
| 2 | Jabam (E) | yes_no | 2025-09-02 |
| 3 | Exercise | dropdown | 2025-09-02 |
| 4 | Don't smoke weed | yes_no | 2025-09-02 |
| 5 | Read 10 pages | yes_no | 2025-11-09 |
| 6 | Sleep Quality | dropdown | 2025-11-11 |
| 7 | Body State on Waking | dropdown | 2025-11-11 |
| 8 | Identity Pressure (10a) | dropdown | 2025-11-11 |
| 9 | 2pm Body Check In | dropdown | 2025-11-11 |
| 10 | Craving Intensity | dropdown | 2025-11-11 |
| 11 | Urge Response | dropdown | 2025-11-11 |
| 12 | Overall Day Quality (8pm) | dropdown | 2025-11-11 |
| 13 | Evening Body Check In | dropdown | 2025-11-11 |
| 14 | Visualization | yes_no | 2025-11-13 |
| 15 | Did I Learn anything today? | yes_no | 2025-11-17 |
| 16 | Wins for the day | yes_no | 2025-11-21 |
| 17 | Cricket on my mind | yes_no | 2025-11-28 |
| 18 | Wedding Vibes | yes_no | 2025-11-30 |
| 19 | Learning about Money | yes_no | 2025-11-30 |

---

## 3. Completions Data Summary

### Volume Statistics

| Metric | Value |
|--------|-------|
| **Total Completion Records** | ~850 |
| **Date Range** | Sep 2, 2025 - Dec 1, 2025 |
| **Days with Data** | 90 |
| **Average Entries/Day** | 9.4 |

### Completion Trends by Month

| Month | Days Tracked | Metrics Tracked | Avg Completeness |
|-------|--------------|-----------------|------------------|
| September | 30 | 4 | 75% |
| October | 31 | 4 | 68% |
| November | 30 | 12-19 | 82% |
| December 1 | 1 | 19 | 89% |

### Key Metric Completion Rates (Nov 10-Dec 1)

| Metric | Completion Rate | Notes |
|--------|-----------------|-------|
| Morning Jabam | 92% | Most consistent |
| Sleep Quality | 95% | Captured daily |
| Identity Pressure | 88% | Core metric |
| Urge Response | 85% | Key outcome |
| Evening Jabam | 71% | First to slip |
| Visualization/MCC | 65% | Highest variance |

---

## 4. Notes Data Summary

### Volume Statistics

| Metric | Value |
|--------|-------|
| **Total Notes** | ~350 |
| **Date Range** | Nov 11, 2025 - Dec 1, 2025 |
| **Average Notes/Day** | 11.7 |
| **Average Note Length** | 180 characters |
| **Max Note Length** | 600 characters |

### Notes by Metric (Most Annotated)

| Metric | Total Notes | Avg Length |
|--------|-------------|------------|
| Don't smoke weed | 22 | 220 chars |
| Identity Pressure | 21 | 250 chars |
| Sleep Quality | 21 | 185 chars |
| Craving Intensity | 20 | 210 chars |
| Overall Day Quality | 20 | 195 chars |
| Morning Jabam | 19 | 165 chars |
| Urge Response | 18 | 235 chars |
| Visualization | 17 | 280 chars |

---

## 5. Sample Data Entries

### Sample Completion Record
```json
{
  "id": "uuid",
  "custom_task_id": "metric-uuid",
  "new_user_id": "user-uuid",
  "value": "Done",
  "completion_date": "2025-11-28",
  "created_at": "2025-11-28T18:37:01.619307+00:00",
  "updated_at": "2025-11-28T18:37:01.619307+00:00"
}
```

### Sample Note Record
```json
{
  "id": "uuid",
  "custom_task_id": "metric-uuid",
  "new_user_id": "user-uuid",
  "note_date": "2025-11-28",
  "note_text": "I have planned out my day well, based on the latest CPO report...",
  "created_at": "2025-11-28T18:37:01.619307+00:00",
  "updated_at": "2025-11-28T18:37:01.619307+00:00"
}
```

---

## 6. Selected Powerful Journal Entries

### November 14, 2025 - The Urge Understanding Breakthrough
> "I have begun to understand the root cause of my urges so well, that today, I literally knew my urge when it came I could recognize it is because I had some kind of identity pressure - mostly from work."

### November 16, 2025 - The Temple Revelation
> "I had a very strong spiritual experience today. At the temple, I was walking around the idle, looking for my next 'immediate' goal to come to me... the one that struck -- was to remove lust from my life. I don't want any of it. I want to divert all of my sexual energy into my life... I know now all stems from identity pressure. Identity root trigger and resolve."

### November 16, 2025 - The Identity Pressure Peak
> "Highest Identity Pressure (IdP) in the last week. I feel overwhelmed to finish work, and feel worthless without. I know this is not right. Be calm. The work does not define me. Finish with calm, focus."

### November 17, 2025 - The Conditional Love Discovery
> "I realized, that it was what I did receive -- conditional love. Conditional on performance, on achievement. Which is why I struggle to just 'be', and constantly need to prove my worth, to just be happy. I must come out of this. My happiness, my worth, is not dependent on my achievement. Enjoy life."

### November 17, 2025 - Definition of Done Insight
> "I don't have a 'definition of done' for the tasks I do. This is it. I actually don't know when I've finished a task, and feel its incomplete and the pressure associated with that, even after I've finished it. I must change this from tomorrow. Begin with a 'specific' end in mind."

### November 24, 2025 - Successful Urge Surfing
> "Officially dodged my first craving today at 9:45a. I did 5 pushups, and now finished my reading and also updated selfpm. I feel so amazing. Ready for the next one. I will try the exact same routine when it comes."

### November 25, 2025 - The First Wave Theory
> "It's just the most crucial thing in the world to have one task after another, and to surf the first urge of the day and not relent to it. It's a very slippery slope. This pattern is all too familiar now, and needs to be averted."

### November 26, 2025 - The Craving Reframe
> "Craving is not a command, but a memory. BEAT THE MEMORY. MAKE NEW ONES!"

### November 28, 2025 - The Portal Moment
> "This is literally the portal to next onwards being completely different. This is the portal to a different frequency of life, from Monday onwards. Just finish your anthropic application. Resume, portfolio, LeaderMode..."

### November 29, 2025 - The Virtuous Cycle Confirmed
> "Great sleep (7+ hours) and Morning routines really are the KEY to setting myself up for the day. Even though I went out drinking last night, I came back on time, ate food and slept by 10:45, and woke up at like 8:30 this morning. I feel absolutely fantastic."

### December 1, 2025 - Self-Compassion & Training
> "I feel quite unmotivated this morning. I literally want to just lie back down and sleep the rest of the day... I have trained for this. I am a person that knows how to mitigate these situations. I will get up, do 5 pushups, breathe 10 times, eat an apple, change my environment, plan my week..."

---

## 7. Data Quality Notes

### Strengths
- High completion rates for core metrics
- Rich qualitative data via notes
- Consistent daily tracking from Nov 11 onwards
- Multiple data points per day enable pattern analysis

### Limitations
- September-October data is sparse (4 metrics only)
- Some metrics added mid-stream (affects longitudinal analysis)
- Note quality varies (some brief, some detailed)
- Weekend data sometimes missing or delayed

### Data Integrity
- No duplicate entries detected
- Timestamps are consistent
- User ID consistent across all records
- Note dates align with completion dates

---

## 8. Export Metadata

```json
{
  "exportedAt": "2025-12-01T17:21:41.007Z",
  "totalRecords": {
    "customTasks": 19,
    "completions": "~850",
    "notes": "~350"
  },
  "fileSize": "409.1KB"
}
```

---

*This summary was generated from the full data export: habit_data_2025-12-01.json*
