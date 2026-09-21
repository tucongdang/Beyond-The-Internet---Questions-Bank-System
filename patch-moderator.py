import re

with open("src/components/questionBank/ModeratorReviewView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("q.obstacle_info?.obstacleKeyword", "(q.obstacle_info as any)?.obstacleKeyword")
content = content.replace("q.obstacle_info?.clues?.length", "(q.obstacle_info as any)?.clues?.length")
content = content.replace("q.obstacle_info?.riskQuestion", "(q.obstacle_info as any)?.riskQuestion")
content = content.replace("q.obstacle_info?.riskAnswer", "(q.obstacle_info as any)?.riskAnswer")

with open("src/components/questionBank/ModeratorReviewView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
