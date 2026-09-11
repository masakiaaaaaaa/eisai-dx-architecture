import { NextResponse } from 'next/server';

// API endpoint to serve Rainmeter skin file for easy installation on any PC
// Usage: GET /api/rainmeter-skin
// Or: GET /api/rainmeter-skin?campusId=2 (to customize campus)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId') || '1';

    const skinContent = `[Rainmeter]
Update=300000
AccurateText=1
DynamicWindowSize=1

[Variables]
ApiUrl=https://eisai-api.vercel.app/api/widget?campusId=${campusId}

[MeasureJSON]
Measure=WebParser
URL=#ApiUrl#
RegExp=(?siU)"announcementCount":([0-9]+).*"eventCount":([0-9]+).*"missionCount":([0-9]+).*"individualCount":([0-9]+).*"lastUpdate":"([^"]*)"
UpdateRate=1

[MeasureAnn]
Measure=WebParser
URL=[MeasureJSON]
StringIndex=1

[MeasureEvt]
Measure=WebParser
URL=[MeasureJSON]
StringIndex=2

[MeasureMis]
Measure=WebParser
URL=[MeasureJSON]
StringIndex=3

[MeasureInd]
Measure=WebParser
URL=[MeasureJSON]
StringIndex=4

[MeasureTime]
Measure=WebParser
URL=[MeasureJSON]
StringIndex=5

; Background
[MeterBg]
Meter=Shape
Shape=Rectangle 0,0,280,100,12 | Fill Color 18,20,28,250 | StrokeWidth 0

; Top gradient line
[MeterTopLine]
Meter=Shape
Shape=Rectangle 0,0,280,3,12,12,0,0 | Fill LinearGradient Grad1 | StrokeWidth 0
Grad1=90 | 100,200,255 ; 0.0 | 180,100,255 ; 1.0

; Title
[MeterTitle]
Meter=String
X=15
Y=12
FontFace=Segoe UI
FontSize=12
FontWeight=600
FontColor=255,255,255
AntiAlias=1
Text=Eisai

[MeterTime]
Meter=String
X=265
Y=15
StringAlign=Right
FontFace=Segoe UI
FontSize=9
FontColor=100,105,120
AntiAlias=1
MeasureName=MeasureTime
Text=%1

; Divider
[MeterDivider]
Meter=Shape
Shape=Rectangle 15,38,250,1 | Fill Color 40,45,60 | StrokeWidth 0

; Stats Row - Box 1 (Announcements)
[MeterBox1]
Meter=Shape
Shape=Rectangle 15,48,55,42,8 | Fill Color 30,35,50 | StrokeWidth 0

[MeterIcon1]
Meter=String
X=42
Y=52
StringAlign=Center
FontFace=Segoe UI Emoji
FontSize=10
Text=📢

[MeterVal1]
Meter=String
X=42
Y=70
StringAlign=Center
FontFace=Segoe UI
FontSize=12
FontWeight=700
FontColor=80,200,140
AntiAlias=1
MeasureName=MeasureAnn
Text=%1

; Stats Row - Box 2 (Events)
[MeterBox2]
Meter=Shape
Shape=Rectangle 78,48,55,42,8 | Fill Color 30,35,50 | StrokeWidth 0

[MeterIcon2]
Meter=String
X=105
Y=52
StringAlign=Center
FontFace=Segoe UI Emoji
FontSize=10
Text=📅

[MeterVal2]
Meter=String
X=105
Y=70
StringAlign=Center
FontFace=Segoe UI
FontSize=12
FontWeight=700
FontColor=100,160,255
AntiAlias=1
MeasureName=MeasureEvt
Text=%1

; Stats Row - Box 3 (Missions)
[MeterBox3]
Meter=Shape
Shape=Rectangle 141,48,55,42,8 | Fill Color 30,35,50 | StrokeWidth 0

[MeterIcon3]
Meter=String
X=168
Y=52
StringAlign=Center
FontFace=Segoe UI Emoji
FontSize=10
Text=📝

[MeterVal3]
Meter=String
X=168
Y=70
StringAlign=Center
FontFace=Segoe UI
FontSize=12
FontWeight=700
FontColor=255,180,80
AntiAlias=1
MeasureName=MeasureMis
Text=%1

; Stats Row - Box 4 (Individual)
[MeterBox4]
Meter=Shape
Shape=Rectangle 204,48,61,42,8 | Fill Color 30,35,50 | StrokeWidth 0

[MeterIcon4]
Meter=String
X=234
Y=52
StringAlign=Center
FontFace=Segoe UI Emoji
FontSize=10
Text=👤

[MeterVal4]
Meter=String
X=234
Y=70
StringAlign=Center
FontFace=Segoe UI
FontSize=12
FontWeight=700
FontColor=180,140,255
AntiAlias=1
MeasureName=MeasureInd
Text=%1

; Click to open dashboard
[MeterClickArea]
Meter=Shape
Shape=Rectangle 0,0,280,100,12 | Fill Color 0,0,0,1 | StrokeWidth 0
LeftMouseUpAction=["https://eisai-api.vercel.app/dashboard"]
ToolTipText=Click to open dashboard
`;

    return new NextResponse(skinContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': 'attachment; filename="Eisai.ini"',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
