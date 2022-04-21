import { Card, CardContent, CardMedia, Typography } from "@mui/material";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

const PlantCard = (props) => {
    return (<>
     <ArrowRightAltIcon sx={{ zIndex:-11, marginLeft: "clamp(132px, 10.5vw, 200px)", marginTop: "70px", position: "absolute", transform: "scale(3,2)", color: "purple", opacity: "0.3" }} />
        <Card sx={{ width: "10vw", minWidth:"120px", maxWidth:"190px" }}>
        <CardMedia
            component="img"
            image={props.found === true ? "/found.jpg" : "/plantlogo.jpg"}
            alt={props.name}
        />
            <CardContent>
                <Typography gutterBottom flexWrap={true} variant="h8" component="div">
                    {props.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {props.text}
                </Typography>

            </CardContent>
           
        </Card>
        </>)
}

export default PlantCard;